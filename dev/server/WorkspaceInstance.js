var WebSocketServer = require('websocket').server;
var http = require('http');
var DocumentInstance = require('./DocumentInstance');
var to = require('../lib/dif');
var com = require('../lib/communication');
var fs = require('fs');

/**
 * @note The WorkspaceInstance will probably send the whole file structure to newly joined clients,
 *       so that clients can view folders and files without interruption.
 */

/**
 * @note Each client message also has to contain an index to the final document in order to 
 *       differentiate them and to save bandwidth as opposed to sending the absolute paths
 *       in each operation
 */

class WorkspaceInstance {
    constructor() {
        this.clientMessageProcessor = this.clientMessageProcessor.bind(this);

        // workspace management
        this.workspaceHash = null;

        this.database = null;

        // document management
        this.documents = new Map(); // maps absolute paths to document instances ///TODO: make this from IDs to instances

        // attributes for client management
        this.clients = new Map(); // maps clientIDs to an object:  { connection, documents[] }

        this.fileStructure = null;
    }

    ///TODO: not implemented
    /**
     * @brief Initializes the workspace.
     */
    initialize(workspaceHash, databaseGateway) {
        this.database = databaseGateway;
        this.workspaceHash = workspaceHash;
        this.fileStructure = this.database.getFileStructureJSON(this.workspaceHash);
        this.createDocument("folder1/file2.txt");

        console.log("Workspace initialized.");
    }

    /**
     * Sends the folder structure to the client and saves the connection.
     * @param {*} connection The WebSocket connection to the client.
     */
    initializeClient(clientID, connection, role) {
        const clientMetadata = {
            connection: connection, // the WebSocket connection
            documents: [],          // references to DocumentInstance objects with which the client interacts
            role: role              // the role of the client in the workspace
        };
        this.clients.set(clientID, clientMetadata);
        this.sendWorkspaceData(clientID, role);
        console.log("WorkspaceInstance: initialized client and sent file structure");
    }

    removeConnection(clientID) {
        const documents = this.clients.get(clientID).documents;
        documents.forEach(document => document.removeConnection(clientID));
        this.clients.delete(clientID);
    }

    closeConnection(clientID) {
        this.clients.get(clientID).connection.close();
    }

    /**
     * @brief Sends the file structure of the workspace to the client.
     * @param {*} clientID The ID of the client.
     * @param {*} role The workspace role of the client.
     */
    sendWorkspaceData(clientID, role) {
        const message = {
            msgType: com.serverMsg.initWorkspace,
            fileStructure: this.fileStructure.items,
            role: role
        };
        this.sendMessageToClient(clientID, JSON.stringify(message));
    }

    sendMessageToClient(clientID, messageString) {
        this.clients.get(clientID).connection.sendUTF(messageString);
    }

    sendMessageToClients(messageString) {
        let clientIterator = this.clients.values();
        for (let i = 0; i < this.clients.size; i++) {
            clientIterator.next().value.sendUTF(messageString);
        }
    }

    enableLogging() {
        this.log = true;
    }

    ///TODO: not implemented
    clientMessageProcessor(message, clientID) {
        if (this.log) console.log('Received Message: ' + JSON.stringify(message));

        if (message.msgType === com.clientMsg.getDocument) {
            console.log("WorkspaceInstance: received file request");
            ///TODO: it is assumed that all clients have the right to view all documents
            if (this.documentExists(message.path)) {
                this.connectClientToDocument(clientID, message.path);
            }
            else {
                // send error message
            }
        }
        // the client want to use the functionality of a document instance
        else {
            ///TODO: this is only a mock implementation
            const document = this.clients.get(clientID).documents[0];
            document.clientMessageProcessor(message, clientID);
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
     * @brief Creates a document in the database and updates the fileStructure object.
     * @param {*} path The path of the document.
     * @returns Returns whether the operation was successfull.
     */
    createDocument(path) {
        ///TODO: validate path
        const success = this.database.createDocument(this.workspaceHash, path);

        if (success) {
            const folder = this.getContainingFolderObject(path);
            const documentName = this.getNameFromPath(path);
            folder[documentName] = {
                type: "file",
                ID: this.fileStructure.nextID++
            };
        }

        return success;
    }

    /**
     * @param {*} path The path to a document.
     * @returns Returns the file structure object representing the folder containing the specified document.
     */
    getContainingFolderObject(path) {
        ///TODO: validate path

        const tokens = path.split('/');
        let folder = this.fileStructure.items;
        for (let i = 0; i < tokens.length - 1; i++) {
            folder = folder[tokens[i]];
        }
        return folder;
    }

    /**
     * @param {*} path The path to a document or folder.
     * @returns Returns the name of the document or folder.
     */
    getNameFromPath(path) {
        const tokens = path.split('/');
        if (tokens.length === 0) {
            return null;
        }
        return tokens[tokens.length - 1];
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
        let document;

        if (!this.documents.has(path)) {
            document = this.startDocument(path);
            if (document === null) {
                // the document could not be instantiated
                ///TODO: send an error message
                return;
            }
        }
        else {
            document = this.documents.get(path);
        }

        const client = this.clients.get(clientID);
        client.documents.push(document);
        document.initializeClient(clientID, client.connection, client.role);
    }

    ///TODO: not implemented
    /**
     * Starts a document instance.
     * 
     * @param {*} path The absolute path to the document.
     * @returns Returns the document if the instantiation succeeded, else returns false.
     */
    startDocument(path) {
        if (this.documents.get(path) !== undefined) return;

        let document = new DocumentInstance();
        document.initialize(path, this.workspaceHash, this.database);
        document.log = this.log;
        this.documents.set(path, document);
        ///TODO: check if succeeded.
        return document
    }

    /**
     * @brief Closes the workspace and all document instances. Updates all files.
     */
    closeWorkspace() {
        
    }
}

module.exports = WorkspaceInstance;
