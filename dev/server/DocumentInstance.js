const WebSocketServer = require('websocket').server;
const http = require('http');
const StatusChecker = require('../lib/status_checker');
const to = require('../lib/dif');
const com = require('../lib/communication');
const DatabaseGateway = require('../database/DatabaseGateway');
const fs = require('fs');


class DocumentInstance {
    constructor() {
        this.clientMessageProcessor = this.clientMessageProcessor.bind(this);
        this.debugHandleMessage = this.debugHandleMessage.bind(this);
        this.processMessage = this.processMessage.bind(this);
        this.GC = this.GC.bind(this);
        this.initializeClient = this.initializeClient.bind(this);

        // attributes for document maintenance
        this.HB = [];
        this.serverOrdering = [];
        this.firstSOMessageNumber = 0; // the total serial number of the first SO entry
        this.document = null;
        this.documentPath = null; // the document path will always be provided by the Controller
        this.database = null;
        this.workspaceHash = null;

        // attributes for user management
        this.users = new Map(); // maps clientIDs to connections

        // attribute for garbage collection
        this.garbageCount = 0; // current amount of messages since last GC
        this.garbageMax = 5; // after how many messages to GC
        this.GCInProgress = false;
        this.garbageRoster = []; // array of clientIDs that are partaking in garbage collection
        this.garbageRosterChecker = null; // StatusChecker got the garbageRoster
        this.GCOldestMessageNumber = null;

        // attributes for testing
        this.messageLog = [];
        this.ordering = { on: false };
        this.log = false;
        this.GCStartDelay = 0;
    }

    /**
     * @brief Initializes the document instance by loading the document from the database.
     * @param {*} path The absolute path to the document (inside the workspace folder).
     */
    initialize(documentPath, workspaceHash, databaseGateway) {
        this.workspaceHash = workspaceHash;
        this.database = databaseGateway;
        this.document = this.getInitialDocument(workspaceHash, documentPath);
        this.documentPath = documentPath;

        console.log("Document initialized.");
    }

    initializeClient(clientID, connection) {
        if (this.users.has(clientID)) {
            ///TODO: handle client present
        }
        else {
            this.users.set(clientID, connection);

            let userInitData = this.createUserInitData(clientID);
            connection.sendUTF(JSON.stringify(userInitData));
        }
    }

    /**
     * @brief Retrieves the initial document state from a file.
     * @note The file should always be present.
     * @param documentPath The path to the file.
     * @returns The initial document state.
     */
    getInitialDocument(workspaceHash, documentPath) {
        let document;

        try {
            const data = this.database.getDocumentData(workspaceHash, documentPath);
            document = data.split(/\r?\n/);
        }
        catch (err) {
            console.error(err)
            document = null;
        }
        
        return document;
    }

    ///TODO: refactor this
    /**
     * @brief Writes the content of the local document to the output document path.
     */
    updateDocumentFile() {
        if (this.documentPath === null) {
            return;
        }

        let documentCopy = JSON.parse(JSON.stringify(this.document)); // deep copy
        // erase file content and write first line
        this.database.writeDocumentData(this.workspaceHash, this.documentPath, documentCopy);
    }

    /**
     * @brief Starts the garbage collection process after enough calls. Sends a message to clients
              prompting them to send metadata needed for the GC process.

     * @note Also saves the current document state to a file for the sake of data loss prevention. ///TODO: should it be in this function?
     */
    startGC() {
        this.garbageCount++;
        if (this.garbageCount >= this.garbageMax && !this.GCInProgress) {
            //if (this.log) console.log("-------------------------------");
            //if (this.log) console.log("Started GC");
            //if (this.log) console.log("-------------------------------");
            this.GCInProgress = true;
            this.GCOldestMessageNumber = null; // reset the oldest message number so a new can be selected
            let message = { msgType: com.msgTypes.GCMetadataRequest };

            // clean up the garbage roster and fill it with current clients
            this.garbageRoster = [];
            let userIterator = this.users.keys();
            for (let i = 0; i < this.users.size; i++) {
                this.garbageRoster.push(userIterator.next().value);
            }
            this.garbageRosterChecker = new StatusChecker(this.garbageRoster.length);
            this.garbageRosterChecker.setReadyCallback(this.GC);

            // send the message to each client
            // testing
            if (this.GCStartDelay > 0) {
                let that = this;
                setTimeout(() => {
                    that.garbageRoster.forEach(clientID => that.sendMessageToClient(clientID, JSON.stringify(message)));
                }, that.GCStartDelay);

            }
            else {
                this.garbageRoster.forEach(clientID => this.sendMessageToClient(clientID, JSON.stringify(message)));
            }

            // reset the counter
            this.garbageCount = 0;
            this.updateDocumentFile();

            ///TODO: start GC timeout clock
        }
    }

    processGCResponse(message) {
        if (this.GCOldestMessageNumber === null || message.dependancy < this.GCOldestMessageNumber) {
            this.GCOldestMessageNumber = message.dependancy;
        }
        let userIndex = this.garbageRoster.indexOf(message.clientID);
        this.garbageRosterChecker.check(userIndex);
    }

    GC() {
        //if (this.log) console.log("-------------------------------");
        //if (this.log) console.log("GC");
        //if (this.log) console.log("-------------------------------");

        // some client has no garbage
        if (this.GCOldestMessageNumber === -1) {
            this.garbageRoster = [];
            this.GCInProgress = false;
            this.GCOldestMessageNumber = null;
            return; // no need to send messages to clients, because they have no state
        }

        // need to subtract this.firstSOMessageNumber, because that is how many SO entries from the beginning are missing
        let SOGarbageIndex = this.GCOldestMessageNumber - this.firstSOMessageNumber;

        let GCClientID = this.serverOrdering[SOGarbageIndex][0];
        let GCCommitSerialNumber = this.serverOrdering[SOGarbageIndex][1];

        let HBGarbageIndex = 0;
        for (let i = 0; i < this.HB.length; i++) {
            let HBClientID = this.HB[i][0][0];
            let HBCommitSerialNumber = this.HB[i][0][1];
            if (HBClientID === GCClientID && HBCommitSerialNumber === GCCommitSerialNumber) {
              HBGarbageIndex = i;
              break;
            }
          }
    
        this.HB = this.HB.slice(HBGarbageIndex);
        this.serverOrdering = this.serverOrdering.slice(SOGarbageIndex);
        this.firstSOMessageNumber += SOGarbageIndex;

        let message = {
            msgType: com.msgTypes.GC,
            GCOldestMessageNumber: this.GCOldestMessageNumber
        };
        this.garbageRoster.forEach(clientID => this.sendMessageToClient(clientID, JSON.stringify(message)));

        this.garbageRoster = [];
        this.GCInProgress = false;
        this.GCOldestMessageNumber = null;
    }

    createUserInitData(clientID) {
        return {
            msgType: com.msgTypes.initialize,
            clientID: clientID,
            serverDocument: to.prim.deepCopy(this.document),
            serverHB: to.prim.deepCopy(this.HB),
            serverOrdering: to.prim.deepCopy(this.serverOrdering),
            firstSOMessageNumber: this.firstSOMessageNumber,
        }
    }

    removeConnection(clientID) {
        this.users.delete(clientID);
        // write to file if all users left
        if (this.users.size == 0) {
            this.updateDocumentFile();
        }
    }

    sendMessageToClient(clientID, messageString) {
        this.users.get(clientID).sendUTF(messageString);
    }

    sendMessageToClients(messageString) {
        let userIterator = this.users.values();
        for (let i = 0; i < this.users.size; i++) {
            userIterator.next().value.sendUTF(messageString);
        }
    }

    // example: [[1, 0], [0, 1, 1, 0]] (two packages, first contains 2 messages, the second contains 4 messages)
    setOrdering(orders) {
        this.ordering.orders = orders;
        this.ordering.currentPackage = 0;
        this.ordering.on = true;
        this.ordering.buffer = [];
    }

    enableLogging() {
        this.log = true;
    }

    clientMessageProcessor(message, clientID) {
        let messageString = JSON.stringify(message);

        if (message.hasOwnProperty('msgType')) {
            if (this.log) console.log('Received Message: ' + messageString);
            if (message.msgType === com.msgTypes.GCMetadataResponse) {
                this.processGCResponse(message);
            }
        }
        // message is an operation
        else {
            if (this.ordering.on) {
                this.debugHandleMessage(message);
            }
            else {
                if (this.log) console.log('Received Message: ' + messageString);
                this.sendMessageToClients(messageString);
                this.processMessage(message);
                this.startGC();
            }
        }
    }

    processMessage(message) {
        let resultingState = to.UDR(message, this.document, this.HB, this.serverOrdering);
        this.serverOrdering.push([message[0][0], message[0][1], message[0][2], message[0][3]]); // append serverOrdering
        this.HB = resultingState.HB;
        this.document = resultingState.document;
    }

    debugHandleMessage(message) {
        this.ordering.buffer.push(message);
        if (this.ordering.buffer.length === this.ordering.orders[this.ordering.currentPackage].length) {
            let userCount = -1;
            let userMessages = [];
            this.ordering.buffer.forEach(message => userCount = (message[0][0] > userCount) ? message[0][0] : userCount);
            userCount++;
            // create a list of lists of messages so that the outer list can be indexed with clientID
            for (let i = 0; i < userCount; i++) {
                userMessages.push([]);
                this.ordering.buffer.forEach(message => {
                    if (message[0][0] === i) {
                        userMessages[i].push(message);
                    }
                });
            }
            let order = this.ordering.orders[this.ordering.currentPackage];
            order.forEach(clientID => {
                let storedMessage = userMessages[clientID].shift();
                let messageString = JSON.stringify(storedMessage);
                if(this.log) console.log('Received Message: ' + messageString);
                this.sendMessageToClients(messageString);
                this.processMessage(storedMessage);
                this.startGC();
            });
            this.ordering.buffer = [];
            this.ordering.currentPackage++;
        }                        
    }
}

module.exports = DocumentInstance;
