var WebSocketServer = require('websocket').server;
var http = require('http');
var DocumentInstance = require('./DocumentInstance');
var to = require('../lib/dif');
var msgTypes = require('../lib/messageTypes');
var fs = require('fs');
const { Console } = require('console');

///TODO: save structure.json and pathMap.json regularly, else progress may be lost

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

        this.paths = null; // maps file IDs to file paths

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
        this.paths = new Map(this.database.getPathMapJSON(this.workspaceHash));

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
            msgType: msgTypes.server.initWorkspace,
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

    ///TODO: not fully implemented
    clientMessageProcessor(message, clientID) {
        if (this.log) console.log('Received Message: ' + JSON.stringify(message));

        if (message.msgType === msgTypes.client.getDocument) {
            console.log("WorkspaceInstance: received file request");
            ///TODO: it is assumed that all clients have the right to view all documents
            if (this.documentExists(message.path)) {
                this.connectClientToDocument(clientID, message.path);
            }
            else {
                // send error message
            }
        }
        else if (message.msgType === msgTypes.client.createDocument) {
            this.handleCreateDocument(message, clientID);
        }
        else if (message.msgType === msgTypes.client.createFolder) {
            this.handleCreateFolder(message, clientID);
        }
        else if (message.msgType === msgTypes.client.deleteDocument) {
            this.handleDeleteDocument(message, clientID);
        }
        else if (message.msgType === msgTypes.client.deleteFolder) {
            this.handleDeleteFolder(message, clientID);
        }
        else if (message.msgType === msgTypes.client.renameFile) {
            this.handleRenameFile(message, clientID);
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
     * @param {*} documentID An ID representing a document in the file structure.
     * @returns Returns true if the documentID points to a document. Else returns false.
     */
    documentExists(documentID) {
        return true;

        const path = this.paths.get(documentID);

        if (path === undefined) {
            return false;
        }

        const documentObj = this.getFileStructureObject(path);
        if (documentObj.type !== "doc") {
            return false;
        }

        return true;
    }

    handleCreateDocument(message, clientID) {
        const result = this.createDocument(message.parentID, message.name);
        if (result.success) {
            ///TODO: log creation
            const response = {
                msgType: msgTypes.server.createDocument,
                parentID: message.parentID,
                fileID: result.fileID,
                name: message.name
            };
            this.sendMessageToClients(JSON.stringify(response));
        }
        else {
            ///TODO: log failure
        }
    }

    handleCreateFolder(message, clientID) {
        const result = this.createFolder(message.parentID, message.name);
        if (result.success) {
            ///TODO: log creation
            const response = {
                msgType: msgTypes.server.createFolder,
                parentID: message.parentID,
                fileID: result.fileID,
                name: message.name
            };
            this.sendMessageToClients(JSON.stringify(response));
        }
        else {
            ///TODO: log failure
        }
    }

    handleDeleteDocument(message, clientID) {
        const result = this.deleteDocument(message.fileID);
        if (result) {
            ///TODO: log deletion
            const response = {
                msgType: msgTypes.server.deleteDocument,
                fileID: result.fileID,
            };
            this.sendMessageToClients(JSON.stringify(response));
        }
        else {
            ///TODO: log failure
        }
    }

    handleDeleteFolder(message, clientID) {
        const result = this.deleteFolder(message.fileID);
        if (result) {
            ///TODO: log deletion
            const response = {
                msgType: msgTypes.server.deleteFolder,
                fileID: result.fileID,
            };
            this.sendMessageToClients(JSON.stringify(response));
        }
        else {
            ///TODO: log failure
        }
    }

    handleRenameFile(message, clientID) {
        const result = this.renameFile(message.fileID, message.name);
        if (result) {
            ///TODO: log rename
            const response = {
                msgType: msgTypes.server.renameFile,
                fileID: result.fileID,
                name: message.name
            };
            this.sendMessageToClients(JSON.stringify(response));
        }
        else {
            ///TODO: log failure
        }
    }

    /**
     * @brief Adds or removes an item from the fileStructure object. Removes the item by default.
     * @param {*} path The path to the item.
     * @param {*} item If specified, adds the item to the fileStructure. If omitted, deletes it instead.
     */
    updateFileStructure(path, item=null) {
        const parentFolder = this.getParentFileStructureObject(path);
        const name = this.getNameFromPath(path);

        if (item !== null) {
            parentFolder.items[name] = item;
        }
        else {
            delete parentFolder.items[name];
        }
    }

    getNewDocumentObj() {
        return {
            type: "doc",
            ID: this.fileStructure.nextID++
        };
    }

    getNewFolderObj() {
        return {
            type: "folder",
            ID: this.fileStructure.nextID++,
            items: {}
        };
    }

    ///TODO: send to all client that a file had been modified

    /**
     * @brief Creates a document in the database and updates the fileStructure object.
     * @param {*} parentID The ID of the parent folder.
     * @param {*} name The name of the new document.
     * @returns Returns an object: { success, fileID }, where success is whether the operation was successfull and fileID is the ID of the new file.
     */
    createDocument(parentID, name) {
        const response = {
            success: false,
            fileID: null
        };

        const parentPath = this.paths.get(parentID);

        if (parentPath === undefined) {
            return response;
        }

        const parentFolder = this.getFileStructureObject(parentPath);

        // fail if the name is taken
        if (parentFolder.items[name] !== undefined) {
            return response;
        }

        const path = (parentID === 0 ? "" : parentPath + "/") + name;
        const success = this.database.createDocument(this.workspaceHash, path);

        if (success) {
            const documentObj = getNewDocumentObj();
            this.updateFileStructure(path, documentObj);
            this.paths.set(documentObj.ID, path);
            response.success = true;
            response.fileID = documentObj.ID;
        }

        return response;
    }

    /**
     * @brief Creates a folder in the database and updates the fileStructure object.
     * @param {*} parentID The ID of the parent folder.
     * @param {*} name The name of the new folder.
     * @returns Returns an object: { success, fileID }, where success is whether the operation was successfull and fileID is the ID of the new file.
     */
    createFolder(parentID, name) {
        const response = {
            success: false,
            fileID: null
        };

        const parentPath = this.paths.get(parentID);

        if (parentPath === undefined) {
            return response;
        }

        const parentFolder = this.getFileStructureObject(parentPath);

        // fail if the name is taken
        if (parentFolder.items[name] !== undefined) {
            return response;
        }

        const path = (parentID === 0 ? "" : parentPath + "/") + name;
        const success = this.database.createFolder(this.workspaceHash, path);

        if (success) {
            const folderObj = getNewFolderObj();
            this.updateFileStructure(path, folderObj);
            this.paths.set(folderObj.ID, path);
            response.success = true;
            response.fileID = folderObj.ID;
        }

        return response;
    }

    /**
     * @brief Deletes a document in the database and updates the fileStructure object.
     * @param {*} ID The ID of the document.
     * @returns Returns whether the operation was successfull.
     */
    deleteDocument(ID) {
        const path = this.paths.get(ID);

        if (path === undefined) {
            return false;
        }

        const documentObj = this.getFileStructureObject(path);
        if (documentObj.type !== "doc") {
            return false;
        }

        const success = this.database.deleteDocument(this.workspaceHash, path);

        if (success) {
            this.updateFileStructure(path);
            this.paths.delete(ID);
        }

        return success;
    }

    /**
     * @brief Deletes a folder in the database and updates the fileStructure object.
     * @param {*} ID The ID of the folder.
     * @returns Returns whether the operation was successfull.
     */
     deleteFolder(ID) {
        const path = this.paths.get(ID);

        if (path === undefined) {
            return false;
        }

        const folderObj = this.getFileStructureObject(path);
        if (folderObj.type !== "folder") {
            return false;
        }

        const success = this.database.deleteFolder(this.workspaceHash, path);

        if (success) {
            this.paths.delete(ID);
            this.recursivePathDelete(this.getFileStructureObject(path));
            this.updateFileStructure(path);
        }

        return success;
    }

    renameFile(ID, newName) {
        const oldPath = this.paths.get(ID);

        if (oldPath === undefined) {
            return false;
        }

        const parentFolder = this.getParentFileStructureObject(oldPath);

        // fail if the name is taken
        if (parentFolder.items[newName] !== undefined) {
            return false;
        }

        const newPath = parentFolder.ID === 0 ? newName : this.paths.get(parentFolder.ID) + "/" + newName;

        const success = this.database.renameFile(this.workspaceHash, oldPath, newPath);

        if (success) {
            const oldName = this.getNameFromPath(oldPath);
            parentFolder.items[newName] = parentFolder.items[oldName];
            delete parentFolder.items[oldName];
            this.paths.set(ID, newPath);
        }

        return success;
    }

    /**
     * @brief Recursively deletes all paths of items in a folder from the paths Map.
     * @param {*} folderObj A folder from the file structure.
     */
    recursivePathDelete(folderObj) {
        for (let item of folderObj.items) {
            if (item.type === "folder") {
                this.recursivePathDelete(item);
            }
            this.paths.delete(item.ID);
        }
    }

    /**
     * @param {*} path The path to a document or folder.
     * @returns Returns an object representing the document or folder from this.fileStructure.
     */
    getFileStructureObject(path) {
        ///TODO: validate path
        ///TODO: does this work for path === "" ?

        let obj = this.fileStructure;
        const tokens = path.split('/');
        for (let i = 0; i < tokens.length; i++) {
            obj = obj.items[tokens[i]];
        }
        return obj;
    }

    /**
     * @param {*} path The path to a document or folder.
     * @returns Returns the folder containing the document or folder represented by path.
     */
     getParentFileStructureObject(path) {
        ///TODO: validate path

        const parentFolderEndIndex = path.lastIndexOf('/');
        if (parentFolderEndIndex === -1) {
            return this.fileStructure;
        }
        return this.getFileStructureObject(path.substring(0, parentFolderEndIndex));
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
     * @brief Closes the workspace and all document instances. Saves all opened documents and updates the file structure.
     */
    closeWorkspace() {
        let documentIterator = this.documents.values();
        for (let i = 0; i < this.documents.size; i++) {
            documentIterator.next().value.closeInstance();
        }

        this.database.changeFileStructure(this.workspaceHash, JSON.stringify(this.fileStructure));
        this.database.changePathMap(this.workspaceHash, JSON.stringify(Array.from(this.paths.entries())));
    }
}

module.exports = WorkspaceInstance;
