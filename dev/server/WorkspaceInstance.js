var WebSocketServer = require('websocket').server;
var http = require('http');
var StatusChecker = require('../lib/status_checker');
var DocumentInstance = require('./DocumentInstance');
var to = require('../lib/dif');
var com = require('../lib/communication');
var fs = require('fs');

/**
 * @note The WorkspaceInstance will probably send the whole file structure to newly joined clients,
 *       so that clients can view folders and files without interruption.
 */

class WorkspaceInstance {
    constructor() {
        this.clientMessageProcessor = this.clientMessageProcessor.bind(this);

        // workspace management
        this.workspaceHash = null;

        // document management
        this.documents = new Map(); // maps absolute paths to document instances

        // attributes for user management
        this.nextclientID = 0;
        this.users = new Map(); // maps clientIDs to connections
    }

    ///TODO: not implemented
    /**
     * @brief Initializes the workspace.
     */
    initialize(workspaceHash) {
        this.workspaceHash = workspaceHash;
        ///TODO: load file structure
    }

    /**
     * Sends the folder structure to the client and saves the connection.
     * @param {*} connection The WebSocket connection to the client.
     */
    initializeClient(connection) {
        const clientID = this.addConnection(connection);
        this.sendFileStructure(clientID);
    }

    addConnection(connection) {
        let clientID = this.getNextclientID();
        this.users.set(clientID, connection);
        return clientID;
    }

    removeConnection(clientID) {
        this.users.delete(clientID);
        // write to file if all users left
        if (this.users.size == 0) {
            this.updateDocumentFile();
        }
    }

    closeConnection(clientID) {
        this.users.get(clientID).close();
    }

    ///TODO: not implemented
    /**
     * @brief Sends the file structure of the workspace to the client.
     * @param {*} clientID The ID of the client.
     */
    sendFileStructure(clientID) {
        const message = {
            msgType: com.serverMsg.sendFileStructure,
            fileStructure: null
        };
        this.sendMessageToClient(clientID, JSON.stringify(message));
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

    enableLogging() {
        this.log = true;
    }

    clientMessageProcessor(messageWrapper) {
        let messageString = messageWrapper.utf8Data;
        let message = JSON.parse(messageString);

        if (message.hasOwnProperty('msgType')) {
            if (this.log) console.log('Received Message: ' + messageString);

            if (message.msgType === com.clientMsg.getDocument) {
                ///TODO: it is assumed that all clients have the right to view all documents
                if (this.documentExists(message.path)) {
                    let clientID = 0; ///TODO: get clientID
                    this.connectClientToDocument(clientID, message.path);
                }
                else {
                    // send error message
                }
            }
        }
    }

    ///TODO: not implemented
    /**
     * @returns Returns true if the path specified points to a document in this workspace.
     *          Else returns false.
     * @param {*} path The absolute path to the document.
     */
    documentExists(path) {
        return true;
    }

    /**
     * @brief Connects a client to a document.
     * 
     * @note It is assumed that the document exists.
     * 
     * @param {*} clientID The ID of the client.
     * @param {*} path The absolute path to the document.
     */
    connectClientToDocument(clientID, path) {
        if (this.documents.get(path) === undefined) {
            if (!this.startDocument(path)) {
                // the document could not be instantiated
                ///TODO: send an error message
            }
        }
        else {
            this.documents.get(path).initializeClient(clientID, this.users.get(clientID));
        }
    }

    ///TODO: not implemented
    /**
     * Starts a document instance.
     * 
     * @param {*} path The absolute path to the document.
     * @returns Returns true if the document initialization succeeded. Else returns false.
     */
    startDocument(path) {
        if (this.documents.get(path) !== undefined) return;

        let document = new DocumentInstance();
        ///TODO: init document
        this.documents.set(path, document);
        ///TODO: check if succeeded.
        return true;
    }
}

module.exports = WorkspaceInstance;
