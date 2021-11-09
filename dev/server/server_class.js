var WebSocketServer = require('websocket').server;
var http = require('http');
var StatusChecker = require('../lib/status_checker');
var to = require('../lib/dif');
var com = require('../lib/communication');
var fs = require('fs');


class Server {
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

        // attributes for user management
        this.nextUserID = 0;
        this.users = new Map(); // maps userIDs to connections

        // attribute for garbage collection
        this.garbageCount = 0; // current amount of messages since last GC
        this.garbageMax = 5; // after how many messages to GC
        this.GCInProgress = false;
        this.garbageRoster = []; // array of userIDs that are partaking in garbage collection
        this.garbageRosterChecker = null; // StatusChecker got the garbageRoster
        this.GCOldestMessageNumber = null;

        // attributes for testing
        this.messageLog = [];
        this.ordering = { on: false };
        this.log = false;
        this.GCStartDelay = 0;
    }

    /**
     * @brief Initializes the websocket server and initial document state.
     * @param documentPath The path to a file storing the initial state.
     */
    initialize(documentPath=null) {
        this.document = this.getInitialDocument(documentPath);
        this.documentPath = documentPath;

        this.server = http.createServer(function(request, response) {
            console.log((new Date()) + ' Received request for ' + request.url);
            console.log(request);
            response.writeHead(404);
            response.end();
        });
        
        this.wsServer = new WebSocketServer({
            httpServer: this.server,
            // You should not use autoAcceptConnections for production
            // applications, as it defeats all standard cross-origin protection
            // facilities built into the protocol and the browser.  You should
            // *always* verify the connection's origin and decide whether or not
            // to accept it.
            autoAcceptConnections: false
        });

        let that = this;
        this.wsServer.on('request', that.initializeClient);
    }

    initializeClient(request) {
        ///TODO: always true
        if (!this.originIsAllowed(request.origin)) {
            // Make sure to only accept requests from an allowed origin
            request.reject();
            console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
            return;
          }
          
          let connection = request.accept('', request.origin); ///TODO: protocol
          let userID = this.addConnection(connection);
          if (this.log) console.log((new Date()) + ' Connection accepted.');
      
          let userInitData = this.createUserInitData(userID);
      
          connection.sendUTF(JSON.stringify(userInitData));
          let that = this;
          connection.on('message', that.clientMessageProcessor);
          connection.on('close', function(reasonCode, description) {
              //console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
              that.removeConnection(userID); // can userID be used, or is it not in the scope?
          });
    }

    /**
     * @brief Retrieves the initial document state from a file.
     * @note The file should always be present. The case when documentPath is null
             is for testing purposes only.
     * @param documentPath The path to the file.
     * @returns The initial document state.
     */
    getInitialDocument(documentPath) {
        let document;
        if (documentPath === null) {
            document = [ "" ];
        }
        else if (this.validateDocumentPath(documentPath)) {
            try {
                const data = fs.readFileSync(documentPath, 'utf8')
                document = data.split(/\r?\n/);
            }
            catch (err) {
                console.error(err)
                document = [ "" ];
            }
        }
        else {
            console.log("Invalid document path.");
            document = [ "" ];
        }
        return document;
    }

    validateDocumentPath(documentPath) {
        return true;
    }

    /**
     * @brief Writes the content of the local document to the output document path.
     */
    updateDocumentFile() {
        if (this.documentPath === null) {
            return;
        }

        let documentCopy = JSON.parse(JSON.stringify(this.document)); // deep copy
        // erase file content and write first line
        fs.writeFile(this.documentPath, documentCopy[0], function(err) {
            if (err) {
                console.error(err);
            }
        });
        // append the rest of lines
        for (let i = 1; i < documentCopy.length; i++) {
            fs.appendFile(this.documentPath, '\n' + documentCopy[i], function(err) {
                if (err) {
                    console.error(err);
                }
            });
        }
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
                    that.garbageRoster.forEach(userID => that.sendMessageToClient(userID, JSON.stringify(message)));
                }, that.GCStartDelay);

            }
            else {
                this.garbageRoster.forEach(userID => this.sendMessageToClient(userID, JSON.stringify(message)));
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
        let userIndex = this.garbageRoster.indexOf(message.userID);
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

        let GCUserID = this.serverOrdering[SOGarbageIndex][0];
        let GCCommitSerialNumber = this.serverOrdering[SOGarbageIndex][1];

        let HBGarbageIndex = 0;
        for (let i = 0; i < this.HB.length; i++) {
            let HBUserID = this.HB[i][0][0];
            let HBCommitSerialNumber = this.HB[i][0][1];
            if (HBUserID === GCUserID && HBCommitSerialNumber === GCCommitSerialNumber) {
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
        this.garbageRoster.forEach(userID => this.sendMessageToClient(userID, JSON.stringify(message)));

        this.garbageRoster = [];
        this.GCInProgress = false;
        this.GCOldestMessageNumber = null;
    }

    addConnection(connection) {
        let userID = this.getNextUserID();
        this.users.set(userID, connection);
        return userID;
    }

    createUserInitData(userID) {
        return {
            msgType: com.msgTypes.initialize,
            userID: userID,
            serverDocument: to.prim.deepCopy(this.document),
            serverHB: to.prim.deepCopy(this.HB),
            serverOrdering: to.prim.deepCopy(this.serverOrdering)
        }
    }

    removeConnection(userID) {
        this.users.delete(userID);
        // write to file if all users left
        if (this.users.size == 0) {
            this.updateDocumentFile();
        }
    }

    getNextUserID() {
        return this.nextUserID++;
    }

    sendMessageToClient(userID, messageString) {
        this.users.get(userID).sendUTF(messageString);
    }

    sendMessageToClients(messageString) {
        let userIterator = this.users.values();
        for (let i = 0; i < this.users.size; i++) {
            userIterator.next().value.sendUTF(messageString);
        }
    }

    originIsAllowed(origin) {
        // put logic here to detect whether the specified origin is allowed.
        return true;
    }

    listen(port) {
        let that = this;
        this.server.listen(port, function() {
            if (that.log) console.log((new Date()) + ' Server is listening on port ' + port);
        });
    }

    close() {
        this.wsServer.shutDown();
        this.server.close();
        this.updateDocumentFile();
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

    clientMessageProcessor(messageWrapper) {
        let messageString = messageWrapper.utf8Data;
        let message = JSON.parse(messageString);

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
            // create a list of lists of messages so that the outer list can be indexed with userID
            for (let i = 0; i < userCount; i++) {
                userMessages.push([]);
                this.ordering.buffer.forEach(message => {
                    if (message[0][0] === i) {
                        userMessages[i].push(message);
                    }
                });
            }
            let order = this.ordering.orders[this.ordering.currentPackage];
            order.forEach(userID => {
                let storedMessage = userMessages[userID].shift();
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

module.exports = Server;
