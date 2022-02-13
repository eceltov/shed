const WebSocketServer = require('websocket').server;
const http = require('http');
const DocumentInstance = require('./DocumentInstance');
const to = require('../lib/dif');
const msgTypes = require('../lib/messageTypes');
const msgFactory = require('../lib/serverMessageFactory');
const fs = require('fs');
const { Console } = require('console');
const roles = require('../lib/roles');

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
        this.documents = new Map(); // maps fileIDs to document instances

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
            documents: new Map(),          // maps fileIDs to document references, contains only those with which the client interacts
            //documents: [],          // references to DocumentInstance objects with which the client interacts
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
        const message = msgFactory.initWorkspace(clientID, this.fileStructure.items, role);
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
        if (message.msgType === msgTypes.client.getDocument) {
            this.handleDocumentRequest(message, clientID);
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
        // Operation, the client want to use the functionality of a document instance
        else {
            const client = this.clients.get(clientID);
            const fileID = message[2];
            if (!client.documents.has(fileID)) {
                console.log("A client was sent an unwanted operation, fileID: ", fileID);
            }
            else {
                const document = client.documents.get(fileID);
                document.clientMessageProcessor(message, clientID);
            }
        }
    }

    /**
     * @param {*} documentID An ID representing a document in the file structure.
     * @returns Returns true if the documentID points to a document. Else returns false.
     */
    documentExists(documentID) {
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

    handleDocumentRequest(message, clientID) {
        console.log("WorkspaceInstance: received file request");
        if (this.documentExists(message.fileID)) {
            this.connectClientToDocument(clientID, message.fileID);
        }
        else {
            // send error message
        }
    }

    handleCreateDocument(message, clientID) {
        const result = this.createDocument(clientID, message.parentID, message.name);
        if (result.success) {
            ///TODO: log creation
            const response = msgFactory.createDocument(message.parentID, result.fileID, message.name);
            this.sendMessageToClients(JSON.stringify(response));
        }
        else {
            ///TODO: log failure
        }
    }

    handleCreateFolder(message, clientID) {
        const result = this.createFolder(clientID, message.parentID, message.name);
        if (result.success) {
            ///TODO: log creation
            const response = msgFactory.createFolder(message.parentID, result.fileID, message.name);
            this.sendMessageToClients(JSON.stringify(response));
        }
        else {
            ///TODO: log failure
        }
    }

    handleDeleteDocument(message, clientID) {
        const result = this.deleteDocument(clientID, message.fileID);
        if (result) {
            ///TODO: log deletion
            const response = msgFactory.deleteDocument(message.fileID);
            this.sendMessageToClients(JSON.stringify(response));
        }
        else {
            ///TODO: log failure
        }
    }

    handleDeleteFolder(message, clientID) {
        const result = this.deleteFolder(clientID, message.fileID);
        if (result) {
            ///TODO: log deletion
            const response = msgFactory.deleteFolder(message.fileID);
            this.sendMessageToClients(JSON.stringify(response));
        }
        else {
            ///TODO: log failure
        }
    }

    handleRenameFile(message, clientID) {
        const result = this.renameFile(clientID, message.fileID, message.name);
        if (result) {
            ///TODO: log rename
            const response = msgFactory.renameFile(message.fileID, message.name);
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

    getClientRole(clientID) {
        return this.clients.get(clientID).role;
    }

    ///TODO: send to all client that a file had been modified

    /**
     * @brief Creates a document in the database and updates the fileStructure object.
     * @param {*} parentID The ID of the parent folder.
     * @param {*} name The name of the new document.
     * @returns Returns an object: { success, fileID }, where success is whether the operation was successfull and fileID is the ID of the new file.
     */
    createDocument(clientID, parentID, name) {
        const response = {
            success: false,
            fileID: null
        };

        if (!roles.canManageFiles(this.getClientRole(clientID))) {
            return response;
        }

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
    createFolder(clientID, parentID, name) {
        const response = {
            success: false,
            fileID: null
        };

        if (!roles.canManageFiles(this.getClientRole(clientID))) {
            return response;
        }

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
     * @param {*} fileID The ID of the document.
     * @returns Returns whether the operation was successfull.
     */
    deleteDocument(clientID, fileID) {
        if (!roles.canManageFiles(this.getClientRole(clientID))) {
            return false;
        }

        const path = this.paths.get(fileID);

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
            this.paths.delete(fileID);
        }

        return success;
    }

    /**
     * @brief Deletes a folder in the database and updates the fileStructure object.
     * @param {*} fileID The ID of the folder.
     * @returns Returns whether the operation was successfull.
     */
     deleteFolder(clientID, fileID) {
        if (!roles.canManageFiles(this.getClientRole(clientID))) {
            return false;
        }

        const path = this.paths.get(fileID);

        if (path === undefined) {
            return false;
        }

        const folderObj = this.getFileStructureObject(path);
        if (folderObj.type !== "folder") {
            return false;
        }

        const success = this.database.deleteFolder(this.workspaceHash, path);

        if (success) {
            this.paths.delete(fileID);
            this.recursivePathDelete(this.getFileStructureObject(path));
            this.updateFileStructure(path);
        }

        return success;
    }

    renameFile(clientID, fileID, newName) {
        if (!roles.canManageFiles(this.getClientRole(clientID))) {
            return false;
        }

        const oldPath = this.paths.get(fileID);

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
            this.paths.set(fileID, newPath);
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
     * @param {*} fileID The fileID of the document.
     */
    connectClientToDocument(clientID, fileID) {
        const client = this.clients.get(clientID);
        if (!roles.canView(client.role)) {
            return;
        }

        let document;

        if (!this.documents.has(fileID)) {
            document = this.startDocument(fileID);
            if (document === null) {
                // the document could not be instantiated
                ///TODO: send an error message
                return;
            }
        }
        else {
            document = this.documents.get(fileID);
        }

        // handle client already connected to the document
        ///TODO: this should probably be handled sooner than here
        if (document.clientPresent(clientID)) {
            return;
        }

        client.documents.set(fileID, document);
        document.initializeClient(clientID, client.connection, client.role);
    }

    ///TODO: not implemented
    /**
     * Starts a document instance.
     * 
     * @param {*} fileID The fileID of the document.
     * @returns Returns the document if the instantiation succeeded, else returns false.
     */
    startDocument(fileID) {
        if (this.documents.get(fileID) !== undefined) return;

        const path = this.paths.get(fileID);
        let document = new DocumentInstance();
        document.initialize(path, fileID, this.workspaceHash, this.database);
        document.log = this.log;
        this.documents.set(fileID, document);
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
