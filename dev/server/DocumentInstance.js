const WebSocketServer = require('websocket').server;
const http = require('http');
const fs = require('fs');
const StatusChecker = require('../lib/status_checker');
const to = require('../lib/dif');
const roles = require('../lib/roles');
const msgTypes = require('../lib/messageTypes');
const msgFactory = require('../lib/serverMessageFactory');
const DatabaseGateway = require('../database/DatabaseGateway');
const fsOps = require('../lib/fileStructureOps');

class DocumentInstance {
  constructor() {
    this.clientMessageProcessor = this.clientMessageProcessor.bind(this);
    this.processOperation = this.processOperation.bind(this);
    this.GC = this.GC.bind(this);
    this.initializeClient = this.initializeClient.bind(this);
    this.clientPresent = this.clientPresent.bind(this);

    this.fileStructure = null;
    this.pathMap = null;
    this.toBeDeleted = false;

    // attributes for document maintenance
    this.HB = [];
    this.serverOrdering = [];
    this.firstSOMessageNumber = 0; // the total serial number of the first SO entry
    this.document = null;
    this.fileID = null; // the ID of the document
    this.database = null;
    this.workspaceHash = null;

    // attributes for client management
    this.clients = new Map(); // maps clientIDs to connections and their roles

    // attribute for garbage collection
    this.garbageCount = 0; // current amount of messages since last GC
    this.garbageMax = 5; // after how many messages to GC
    this.GCInProgress = false;
    this.garbageRoster = []; // array of clientIDs that are partaking in garbage collection
    this.garbageRosterChecker = null; // StatusChecker got the garbageRoster
    this.GCOldestMessageNumber = null;

    // attributes for testing
    this.enableLogging = false;
    this.messageLog = [];
    this.ordering = { on: false };
    this.GCStartDelay = 0;
  }

  /**
     * @brief Initializes the document instance by loading the document from the database.
     * @param {*} path The absolute path to the document (inside the workspace folder).
     */
  initialize(fileStructure, pathMap, fileID, workspaceHash, databaseGateway) {
    this.workspaceHash = workspaceHash;
    this.database = databaseGateway;
    this.fileStructure = fileStructure;
    this.pathMap = pathMap;
    this.fileID = fileID;
    this.document = this.getInitialDocument();

    if (this.loggingEnabled) console.log('Document initialized.');
  }

  initializeClient(clientID, connection, role) {
    if (this.clientPresent(clientID)) {
      /// TODO: handle client present
    }
    else {
      const clientMetadata = {
        connection, // the WebSocket connection
        role, // the role of the client in the workspace
      };
      this.clients.set(clientID, clientMetadata);

      const clientInitData = msgFactory.initDocument(
        this.document, this.fileID, this.HB, this.serverOrdering, this.firstSOMessageNumber,
      );
      connection.sendUTF(JSON.stringify(clientInitData));
    }
  }

  /**
   * @brief Resets all variables necessary for the UDR algorithm and garbage collection.
   * @note Should be called after all clients leave and the final document state is saved.
   */
  resetAlgorithmVariables() {
    this.HB = [];
    this.serverOrdering = [];
    this.firstSOMessageNumber = 0;
    this.garbageCount = 0;
    this.GCInProgress = false;
    this.garbageRoster = [];
    this.garbageRosterChecker = null;
    this.GCOldestMessageNumber = null;
  }

  clientPresent(clientID) {
    return this.clients.has(clientID);
  }

  /**
     * @brief Retrieves the initial document state from a file.
     * @note The file should always be present.
     * @returns The initial document state.
     */
  getInitialDocument() {
    let document;

    try {
      const absolutePath = fsOps.getAbsolutePathFromIDPath(
        this.fileStructure, this.pathMap.get(this.fileID),
      );
      const data = this.database.getDocumentData(this.workspaceHash, absolutePath);
      document = data.split(/\r?\n/);
    }
    catch (err) {
      console.error(err);
      document = null;
    }

    return document;
  }

  /**
     * @brief Writes the content of the local document to the output document path.
     */
  updateDocumentFile() {
    if (!this.toBeDeleted) {
      const documentCopy = JSON.parse(JSON.stringify(this.document)); // deep copy
      // erase file content and write first line
      const absolutePath = fsOps.getAbsolutePathFromIDPath(
        this.fileStructure, this.pathMap.get(this.fileID),
      );
      this.database.writeDocumentData(this.workspaceHash, absolutePath, documentCopy);
      if (this.loggingEnabled) console.log('Updated file in database.');
    }
  }

  /**
     * @brief Starts the garbage collection process after enough calls. Sends a message to clients
              prompting them to send metadata needed for the GC process.

     * @note Also saves the current document state to a file for the sake of
          data loss prevention. ///TODO: should it be in this function?
     */
  startGC() {
    this.garbageCount++;
    if (this.garbageCount >= this.garbageMax && !this.GCInProgress) {
      // if (this.log) console.log("-------------------------------");
      // if (this.log) console.log("Started GC");
      // if (this.log) console.log("-------------------------------");
      this.GCInProgress = true;
      this.GCOldestMessageNumber = null; // reset the oldest message number so a new can be selected
      const message = msgFactory.GCMetadataRequest(this.fileID);

      // clean up the garbage roster and fill it with current clients
      this.garbageRoster = [];
      const clientIterator = this.clients.keys();
      for (let i = 0; i < this.clients.size; i++) {
        this.garbageRoster.push(clientIterator.next().value);
      }
      this.garbageRosterChecker = new StatusChecker(this.garbageRoster.length);
      this.garbageRosterChecker.setReadyCallback(this.GC);

      // send the message to each client
      // testing
      const messageString = JSON.stringify(message);
      if (this.GCStartDelay > 0) {
        const that = this;
        setTimeout(() => {
          that.garbageRoster.forEach((clientID) => {
            that.sendMessageToClient(clientID, messageString);
          });
        }, that.GCStartDelay);
      }
      else {
        this.garbageRoster.forEach((clientID) => this.sendMessageToClient(clientID, messageString));
      }

      if (this.loggingEnabled) console.log('Sent GCMetadataRequest');

      // reset the counter
      this.garbageCount = 0;
      this.updateDocumentFile();

      /// TODO: start GC timeout clock
    }
  }

  processGCResponse(message) {
    if (this.GCOldestMessageNumber === null || message.dependancy < this.GCOldestMessageNumber) {
      this.GCOldestMessageNumber = message.dependancy;
    }
    const clientIndex = this.garbageRoster.indexOf(message.clientID);
    this.garbageRosterChecker.check(clientIndex);
  }

  GC() {
    // if (this.log) console.log("-------------------------------");
    if (this.loggingEnabled) console.log('GC');
    // if (this.log) console.log("-------------------------------");

    // some client has no garbage
    if (this.GCOldestMessageNumber === -1) {
      this.garbageRoster = [];
      this.GCInProgress = false;
      this.GCOldestMessageNumber = null;
      return; // no need to send messages to clients, because they have no state
    }

    // need to subtract this.firstSOMessageNumber,
    //    because that is how many SO entries from the beginning are missing
    const SOGarbageIndex = this.GCOldestMessageNumber - this.firstSOMessageNumber;

    const GCClientID = this.serverOrdering[SOGarbageIndex][0];
    const GCCommitSerialNumber = this.serverOrdering[SOGarbageIndex][1];

    let HBGarbageIndex = 0;
    for (let i = 0; i < this.HB.length; i++) {
      const HBClientID = this.HB[i][0][0];
      const HBCommitSerialNumber = this.HB[i][0][1];
      if (HBClientID === GCClientID && HBCommitSerialNumber === GCCommitSerialNumber) {
        HBGarbageIndex = i;
        break;
      }
    }

    this.HB = this.HB.slice(HBGarbageIndex);
    this.serverOrdering = this.serverOrdering.slice(SOGarbageIndex);
    this.firstSOMessageNumber += SOGarbageIndex;

    const message = msgFactory.GC(this.fileID, this.GCOldestMessageNumber);
    this.garbageRoster.forEach((clientID) => {
      this.sendMessageToClient(clientID, JSON.stringify(message));
    });

    this.garbageRoster = [];
    this.GCInProgress = false;
    this.GCOldestMessageNumber = null;
  }

  removeConnection(clientID) {
    this.clients.delete(clientID);
    // write to file and reset variables if all clients left
    if (this.clients.size === 0) {
      this.updateDocumentFile();

      /// TODO: removing a connection does not mean that the same client will not attempt to
      /// connect again, this should not be here, or at least used in this context
      // this.resetAlgorithmVariables();
    }
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

  clientMessageProcessor(message, clientID) {
    const messageString = JSON.stringify(message);

    if (message.msgType !== undefined) {
      if (message.msgType === msgTypes.client.GCMetadataResponse) {
        this.processGCResponse(message);
      }
    }
    // message is an operation
    else {
      const { role } = this.clients.get(clientID);
      if (roles.canEdit(role) && !this.ordering.on) {
        this.sendMessageToClients(messageString);
        this.processOperation(message);
        this.startGC();
      }
      // debug only
      else if (roles.canEdit(role) && this.ordering.on) {
        this.debugHandleOperation(message);
      }
      else {
        // eslint-disable-next-line no-lonely-if
        if (this.loggingEnabled) console.log('Unauthorized edit request');
        /// TODO: handle unauthorized edit request
      }
    }
  }

  processOperation(message) {
    const resultingState = to.UDR(message, this.document, this.HB, this.serverOrdering);
    this.serverOrdering.push(
      [message[0][0], message[0][1], message[0][2], message[0][3]],
    ); // append serverOrdering
    this.HB = resultingState.HB;
    this.document = resultingState.document;
  }

  /// TODO: what should happen here? Make clients unable to edit the document,
  ///   but what about messages on the way?
  closeInstance() {
    /* // send closing message
        let clientIterator = this.clients.values();
        for (let i = 0; i < this.clients.size; i++) {
            //clientIterator.next().value.connection.sendUTF(messageString);
        } */

    // remove all connections
    this.clients = new Map();

    this.updateDocumentFile();
    // this.resetAlgorithmVariables();
  }

  delete() {
    this.clients = new Map();
    this.toBeDeleted = true;
  }

  // Debug only
  debugSetOrdering(orders) {
    this.ordering.orders = orders;
    this.ordering.currentPackage = 0;
    this.ordering.on = true;
    this.ordering.buffer = [];
  }

  debugHandleOperation(message) {
    this.ordering.buffer.push(message);
    if (this.ordering.buffer.length === this.ordering.orders[this.ordering.currentPackage].length) {
      let userCount = -1;
      const userMessages = [];
      this.ordering.buffer.forEach((bufferedMessage) => {
        userCount = (bufferedMessage[0][0] > userCount) ? bufferedMessage[0][0] : userCount;
      });
      userCount++;
      // create a list of lists of messages so that the outer list can be indexed with clientID
      for (let i = 0; i < userCount; i++) {
        userMessages.push([]);
        this.ordering.buffer.forEach((bufferedMessage) => {
          if (bufferedMessage[0][0] === i) {
            userMessages[i].push(bufferedMessage);
          }
        });
      }
      const order = this.ordering.orders[this.ordering.currentPackage];
      order.forEach((clientID) => {
        const storedMessage = userMessages[clientID].shift();
        const messageString = JSON.stringify(storedMessage);
        if (this.log) console.log('Received Message: ' + messageString);
        this.sendMessageToClients(messageString);
        this.processOperation(storedMessage);
        this.startGC();
      });
      this.ordering.buffer = [];
      this.ordering.currentPackage++;
    }
  }
}

module.exports = DocumentInstance;
