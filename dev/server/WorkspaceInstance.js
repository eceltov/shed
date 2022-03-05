const DocumentInstance = require('./DocumentInstance');
const msgTypes = require('../lib/messageTypes');
const msgFactory = require('../lib/serverMessageFactory');
const fsOps = require('../lib/fileStructureOps');
const roles = require('../lib/roles');

/// TODO: save structure.json and pathMap.json regularly, else progress may be lost

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

    this.pathMap = null; // maps file IDs to ID file paths

    this.fileStructure = null;

    this.loggingEnabled = false;
  }

  /// TODO: not implemented
  /**
     * @brief Initializes the workspace.
     */
  initialize(workspaceHash, databaseGateway) {
    this.database = databaseGateway;
    this.workspaceHash = workspaceHash;
    this.fileStructure = this.database.getFileStructureJSON(this.workspaceHash);
    this.pathMap = fsOps.getIDPathMap(this.fileStructure);
    // this.pathMap = new Map(this.database.getPathMapJSON(this.workspaceHash));

    if (this.loggingEnabled) console.log('Workspace initialized.');
  }

  /**
     * Sends the folder structure to the client and saves the connection.
     * @param {*} connection The WebSocket connection to the client.
     */
  initializeClient(clientID, connection, role) {
    const clientMetadata = {
      connection, // the WebSocket connection

      /** maps fileIDs to document references,
       *  contains only those with which the client interacts */
      documents: new Map(),

      role, // the role of the client in the workspace
    };
    this.clients.set(clientID, clientMetadata);
    this.sendWorkspaceData(clientID, role);
    if (this.loggingEnabled) console.log('WorkspaceInstance: initialized client and sent file structure');
  }

  removeConnection(clientID) {
    if (!this.clients.has(clientID)) {
      /// TODO: handle missing clientID
      return;
    }
    const { documents } = this.clients.get(clientID);
    documents.forEach((document) => document.removeConnection(clientID));
    this.clients.delete(clientID);
    if (this.clients.size === 0) {
      this.saveMetadata();
    }
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
    const message = msgFactory.initWorkspace(clientID, this.fileStructure, role);
    this.sendMessageToClient(clientID, JSON.stringify(message));
  }

  sendMessageToClient(clientID, messageString) {
    this.clients.get(clientID).connection.sendUTF(messageString);
  }

  sendMessageToClients(messageString) {
    const clientIterator = this.clients.values();
    for (let i = 0; i < this.clients.size; i++) {
      clientIterator.next().value.connection.sendUTF(messageString);
    }
  }

  enableLogging() {
    this.loggingEnabled = true;
  }

  /// TODO: not fully implemented
  clientMessageProcessor(message, clientID) {
    const client = this.clients.get(clientID);
    if (client === undefined) {
      if (this.loggingEnabled) console.log('!!! ClientID undefined');
      return;
    }

    if (message.fileID !== undefined) {
      message.fileID = parseInt(message.fileID, 10);
    }
    if (message.parentID !== undefined) {
      message.parentID = parseInt(message.parentID, 10);
    }

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
    else if (message.msgType === msgTypes.client.closeDocument) {
      this.handleCloseDocument(message, clientID);
    }
    // Operation, the client want to use the functionality of a document instance
    else {
      const fileID = (message.msgType === undefined) ? message[2] : message.fileID;
      if (!client.documents.has(fileID)) {
        if (this.loggingEnabled) console.log('!!! A client sent an operation to a document he does not have opened, fileID: ', fileID, 'operation:', message);
      }
      else {
        const document = client.documents.get(fileID);
        document.clientMessageProcessor(message, clientID);
      }
    }
  }

  handleCloseDocument(message, clientID) {
    const { documents } = this.clients.get(clientID);
    if (documents.has(message.fileID)) {
      const document = documents.get(message.fileID);
      document.removeConnection(clientID);
      documents.delete(message.fileID);
      if (this.loggingEnabled) console.log('Client closed a document');
    }
    else {
      // eslint-disable-next-line no-lonely-if
      if (this.loggingEnabled) console.log('!!! Client wanted to close a unopened document. ClientID:', clientID, 'FileID:', message.fileID);
    }
  }

  handleDocumentRequest(message, clientID) {
    if (this.loggingEnabled) console.log('WorkspaceInstance: received file request');
    if (fsOps.isDocument(this.fileStructure, this.pathMap, message.fileID)) {
      this.connectClientToDocument(clientID, message.fileID);
    }
    else {
      // send error message
    }
  }

  handleCreateDocument(message, clientID) {
    const result = this.createDocument(clientID, message.parentID, message.name);
    if (result.success) {
      /// TODO: log creation
      const response = msgFactory.createDocument(message.parentID, result.fileID, message.name);
      this.sendMessageToClients(JSON.stringify(response));
    }
    else {
      /// TODO: log failure
    }
  }

  handleCreateFolder(message, clientID) {
    const result = this.createFolder(clientID, message.parentID, message.name);
    if (result.success) {
      /// TODO: log creation
      const response = msgFactory.createFolder(message.parentID, result.fileID, message.name);
      this.sendMessageToClients(JSON.stringify(response));
    }
    else {
      /// TODO: log failure
    }
  }

  handleDeleteDocument(message, clientID) {
    const result = this.deleteDocument(clientID, message.fileID);
    if (result) {
      /// TODO: log deletion
      const response = msgFactory.deleteDocument(message.fileID);
      this.sendMessageToClients(JSON.stringify(response));
    }
    else {
      /// TODO: log failure
    }
  }

  handleDeleteFolder(message, clientID) {
    const result = this.deleteFolder(clientID, message.fileID);
    if (result) {
      /// TODO: log deletion
      const response = msgFactory.deleteFolder(message.fileID);
      this.sendMessageToClients(JSON.stringify(response));
    }
    else {
      /// TODO: log failure
    }
  }

  handleRenameFile(message, clientID) {
    const result = this.renameFile(clientID, message.fileID, message.name);
    if (result) {
      /// TODO: log rename
      const response = msgFactory.renameFile(message.fileID, message.name);
      this.sendMessageToClients(JSON.stringify(response));
    }
    else {
      /// TODO: log failure
    }
  }

  getClientRole(clientID) {
    return this.clients.get(clientID).role;
  }

  /// TODO: send to all client that a file had been modified

  /**
     * @brief Creates a document in the database and updates the fileStructure object.
     * @param {*} parentID The ID of the parent folder.
     * @param {*} name The name of the new document.
     * @returns Returns an object: { success, fileID },
     *  where success is whether the operation was successfull and fileID is the ID of the new file.
     */
  createDocument(clientID, parentID, name) {
    const response = {
      success: false,
      fileID: null,
    };

    if (!fsOps.validateFileName(name)) {
      return response;
    }

    if (!roles.canManageFiles(this.getClientRole(clientID))) {
      return response;
    }

    const documentObj = fsOps.getNewDocumentObj(this.fileStructure.nextID++, name);
    if (fsOps.addFile(this.fileStructure, this.pathMap, parentID, documentObj)) {
      const absolutePath = fsOps.getAbsolutePathFromIDPath(
        this.fileStructure, this.pathMap.get(documentObj.ID),
      );
      const DBSuccess = this.database.createDocument(this.workspaceHash, absolutePath);
      if (!DBSuccess) {
        fsOps.removeFile(this.fileStructure, this.pathMap, documentObj.ID);
      }
      else {
        response.success = true;
        response.fileID = documentObj.ID;
      }
    }
    else {
      // eslint-disable-next-line no-lonely-if
      if (this.loggingEnabled) console.log('Document creation failed!');
    }

    return response;
  }

  /**
     * @brief Creates a folder in the database and updates the fileStructure object.
     * @param {*} parentID The ID of the parent folder.
     * @param {*} name The name of the new folder.
     * @returns Returns an object: { success, fileID }, where success is whether the
     *    operation was successfull and fileID is the ID of the new file.
     */
  createFolder(clientID, parentID, name) {
    const response = {
      success: false,
      fileID: null,
    };

    if (!fsOps.validateFileName(name)) {
      return response;
    }

    if (!roles.canManageFiles(this.getClientRole(clientID))) {
      return response;
    }

    const folderObj = fsOps.getNewFolderObj(this.fileStructure.nextID++, name);
    if (fsOps.addFile(this.fileStructure, this.pathMap, parentID, folderObj)) {
      const absolutePath = fsOps.getAbsolutePathFromIDPath(
        this.fileStructure, this.pathMap.get(folderObj.ID),
      );
      const DBSuccess = this.database.createFolder(this.workspaceHash, absolutePath);
      if (!DBSuccess) {
        fsOps.removeFile(this.fileStructure, this.pathMap, folderObj.ID);
      }
      else {
        response.success = true;
        response.fileID = folderObj.ID;
      }
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

    const absolutePath = fsOps.getAbsolutePathFromIDPath(
      this.fileStructure, this.pathMap.get(fileID),
    );
    if (absolutePath !== null && fsOps.removeFile(this.fileStructure, this.pathMap, fileID)) {
      // close document
      if (this.documents.has(fileID)) {
        const document = this.documents.get(fileID);
        document.delete();
        this.documents.delete(fileID);

        // remove document reference from clients
        const clientIterator = this.clients.values();
        for (let i = 0; i < this.clients.size; i++) {
          clientIterator.next().value.documents.delete(fileID);
        }
      }

      const DBSuccess = this.database.deleteDocument(this.workspaceHash, absolutePath);
      if (!DBSuccess) {
        /// TODO: try it again later
      }
      return true;
    }

    return false;
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

    const folderObj = fsOps.getFileObject(this.fileStructure, this.pathMap, fileID);
    if (folderObj === null) {
      return false;
    }
    // delete all nested files
    Object.values(folderObj.items).forEach((fileObj) => {
      if (fileObj.type === fsOps.types.document) {
        this.deleteDocument(clientID, fileObj.ID);
      }
      else if (fileObj.type === fsOps.types.folder) {
        this.deleteFolder(clientID, fileObj.ID);
      }
    });

    const absolutePath = fsOps.getAbsolutePathFromIDPath(
      this.fileStructure, this.pathMap.get(fileID),
    );
    if (absolutePath !== null && fsOps.removeFile(this.fileStructure, this.pathMap, fileID)) {
      const DBSuccess = this.database.deleteFolder(this.workspaceHash, absolutePath);
      if (!DBSuccess) {
        /// TODO: try it again later
      }
      return true;
    }

    return false;
  }

  renameFile(clientID, fileID, newName) {
    if (!roles.canManageFiles(this.getClientRole(clientID))) {
      return false;
    }

    if (!fsOps.validateFileName(newName)) {
      return response;
    }

    const oldPath = fsOps.getAbsolutePathFromIDPath(this.fileStructure, this.pathMap.get(fileID));
    if (fsOps.renameFile(this.fileStructure, this.pathMap, fileID, newName)) {
      const newPath = fsOps.getAbsolutePathFromIDPath(this.fileStructure, this.pathMap.get(fileID));
      const DBSuccess = this.database.renameFile(this.workspaceHash, oldPath, newPath);
      if (!DBSuccess) {
        /// TODO: try it again later
      }
      return true;
    }

    return false;
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
        /// TODO: send an error message
        return;
      }
    }
    else {
      document = this.documents.get(fileID);
    }

    // handle client already connected to the document
    /// TODO: this should probably be handled sooner than here
    if (document.clientPresent(clientID)) {
      return;
    }

    client.documents.set(fileID, document);
    document.initializeClient(clientID, client.connection, client.role);
  }

  /// TODO: not implemented
  /**
     * Starts a document instance.
     *
     * @param {*} fileID The fileID of the document.
     * @returns Returns the document if the instantiation succeeded, else returns false.
     */
  startDocument(fileID) {
    if (this.documents.get(fileID) !== undefined) {
      if (this.loggingEnabled) console.log('Attempt to start nonexistent document!');
      return false;
    }

    const document = new DocumentInstance();
    document.initialize(
      this.fileStructure, this.pathMap, fileID, this.workspaceHash, this.database,
    );
    document.loggingEnabled = this.loggingEnabled;
    this.documents.set(fileID, document);
    /// TODO: check if succeeded.
    return document;
  }

  saveMetadata() {
    this.database.changeFileStructure(this.workspaceHash, JSON.stringify(this.fileStructure));
  }

  /**
     * @brief Closes the workspace and all document instances. Saves all opened
     *   documents and updates the file structure.
     */
  closeWorkspace() {
    if (this.loggingEnabled) console.log('Closing Workspace');
    const documentIterator = this.documents.values();
    for (let i = 0; i < this.documents.size; i++) {
      documentIterator.next().value.closeInstance();
    }

    // forget all clients
    this.clients = new Map();

    this.saveMetadata();
  }
}

module.exports = WorkspaceInstance;
