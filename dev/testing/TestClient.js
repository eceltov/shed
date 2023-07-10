const to = require('../controller/lib/dif');
const { msgTypes } = require('../controller/lib/messageTypes.js');
const { wrapDif } = require('../controller/lib/subdifOps');
const fsOps = require('../controller/lib/fileStructureOps');
const { roles } = require('../controller/lib/roles');
const ManagedSession = require('../controller/lib/ManagedSession');
var WebSocketClient = require('websocket').client;
const ace = require('./aceTesting');
const EditSession = ace.require('ace/edit_session').EditSession;

class Client {
  constructor(serverURL) {
    this.sendMessageToServer = this.sendMessageToServer.bind(this);
    this.serverMessageProcessor = this.serverMessageProcessor.bind(this);
    this.serverMessageProcessorImpl = this.serverMessageProcessorImpl.bind(this);
    this.propagateLocalDif = this.propagateLocalDif.bind(this);

    this.role = roles.none;
    this.fileStructure = null;
    this.activeTab = null; // fileID of active document
    this.activeFile = null;
    this.tabs = []; // fileIDs in the same order as the final tabs

    this.serverURL = serverURL;

    // eslint-disable-next-line react/no-unused-class-component-methods
    this.connection = null;
    this.editor = null;
    this.clientID = null;

    /** contains fileIDs of documents requested from the server that did not arrive yet */
    this.requestedDocuments = new Set();
    this.openedDocuments = new Map(); // maps fileIDs of documents to ManagedSessions
    this.pathMap = new Map(); // maps fileIDs to ID file paths

    /** maps fileIDs of closed documents to their next commitSerialNumbers
     * (they cannot start again from 0) */
    this.savedCommitSerialNumbers = new Map();

    this.SCLatency = 0;
    this.CSLatency = 0;
    this.testFileID = null;

    this.loggingEnabled = false;
    this.bufferingDisabled = false;
  }

  disableBuffering() {
    this.bufferingDisabled = true;
  }

  getDocument(fileID) {
    return this.openedDocuments.get(fileID).getSession().getDocument().getAllLines();
  }

  getServerOrdering() {
    return this.openedDocuments.get(this.testFileID).serverOrdering;
  }

  sendMessageToServer(messageString) {
    if (this.loggingEnabled) console.log(this.clientID, 'Sending message:', messageString);
    const that = this;
    setTimeout(() => {
      that.connection.send(messageString);
    }, that.CSLatency); // latency testing
  }

  delayedPropagateLocalDif(dif, delay) {
    const that = this;
    setTimeout(() => {
      that.propagateLocalDif(dif);
    }, delay); // latency testing
  }

  propagateLocalDif(dif) {
    if (this.loggingEnabled) console.log(this.clientID, 'propagating local dif:', JSON.stringify(dif));
    if (!this.openedDocuments.has(this.testFileID)) {
      if (this.loggingEnabled) console.log(this.clientID, "Test document missing!");
    }
    const wDif = wrapDif(dif);
    const managedSession = this.openedDocuments.get(this.testFileID);
    const document = managedSession.getSession().getDocument();

    to.applyDifAce(wDif, document);

    // manual interval buffer flush so that subdifs are not applied and sent one by one
    if (this.bufferingDisabled) {
      managedSession.processIntervalBuffer();
    }
  }

  serverMessageProcessor(message) {
    // if (this.loggingEnabled) console.log(this.clientID, 'received message');
    const that = this;
    setTimeout(function () {
      that.serverMessageProcessorImpl(message);
    }, that.SCLatency); // latency testing
  }

  serverMessageProcessorImpl(message) {
    //if (this.loggingEnabled) console.log(this.clientID, JSON.stringify(message));
    const type = message.msgType;

    if (type === undefined) {
      // for debug purposes only, used for status checkers
      if (this.onMessageCallback !== null) {
        this.onMessageCallback(this.onMessageCallbackArgument);
      } 
      this.onOperation(message);
    }
    /* else if (type === msgTypes.server.initialize) {
            this.onInitialize(message);
        } */
    else if (type === msgTypes.server.initWorkspace) {
      this.onInitWorkspace(message);
    }
    else if (type === msgTypes.server.initDocument) {
      this.onInitDocument(message);
    }
    else if (type === msgTypes.server.GCMetadataRequest) {
      this.onGCMetadataRequest(message);
    }
    else if (type === msgTypes.server.GC) {
      this.onGC(message);
    }
   /* else if (type === msgTypes.server.createDocument) {
      this.onCreateDocument(message);
    }
    else if (type === msgTypes.server.createFolder) {
      this.onCreateFolder(message);
    }
    else if (type === msgTypes.server.deleteDocument) {
      this.onDeleteDocument(message);
    }
    else if (type === msgTypes.server.deleteFolder) {
      this.onDeleteFolder(message);
    }
    else if (type === msgTypes.server.renameFile) {
      this.onRenameFile(message);
    }*/
    else {
      if (this.loggingEnabled) console.log(this.clientID, `Received unknown message type: ${JSON.stringify(message)}`);
    }
  }

  onInitWorkspace(message) {
    if (this.loggingEnabled) {
      console.log(this.clientID, 'init workspace');
    }
    this.clientID = message.clientID;
    this.pathMap = fsOps.getIDPathMap(message.fileStructure);
    this.role = message.role;
    this.fileStructure = message.fileStructure;
    this.activeFile = message.fileStructure.ID;

    // request a document for testing
    this.requestDocument(this.testFileID);
  }

  onInitDocument(message) {
    if (this.loggingEnabled) {
      console.log(this.clientID, 'init document');
    }
    const mode = "ace/mode/javascript";
    const session = new EditSession(message.serverDocument, mode);

    // check if a commitSerialNumber exists for this document
    let commitSerialNumber = 0;
    if (this.savedCommitSerialNumbers.has(message.fileID)) {
      commitSerialNumber = this.savedCommitSerialNumbers.get(message.fileID);
    }

    const managedSession = new ManagedSession(
      session, this.clientID, commitSerialNumber, this.sendMessageToServer, message,
    );
    if (this.bufferingDisabled) {
      managedSession.setListenInterval(0);
      managedSession.DEBUG = true;
    }
    if (this.loggingEnabled) managedSession.loggingEnabled = true;
    this.openedDocuments.set(message.fileID, managedSession);

    this.tabs = [message.fileID, ...(this.tabs)];
    this.activeTab = message.fileID;

    if (this.onConnectionCallback !== null) {
      this.onConnectionCallback(this.onConnectionCallbackArgument);
    }
  }

  onGCMetadataRequest(message) {
    if (!this.openedDocuments.has(message.fileID)) {
      if (this.loggingEnabled) console.log(this.clientID, 'Invalid GCMetadataRequest fileID:', message.fileID);
    }
    else {
      this.openedDocuments.get(message.fileID).sendGCMetadataResponse();
    }
  }

  onGC(message) {
    if (!this.openedDocuments.has(message.fileID)) {
      if (this.loggingEnabled) console.log(this.clientID, 'Invalid GC fileID:', message.fileID);
    }
    else {
      this.openedDocuments.get(message.fileID).GC(message);
    }
  }

  onOperation(message) {
    if (this.loggingEnabled) {
      console.log(this.clientID, 'received operation:', JSON.stringify(message));
    }
    const oldCursorPosition = null;

    if (!this.openedDocuments.has(message[2])) {
      if (this.loggingEnabled) console.log(this.clientID, 'Invalid Operation fileID:', message[2]);
    }
    this.openedDocuments.get(message[2]).processOperation(message, oldCursorPosition);
  }

  requestDocument(fileID) {
    if (this.loggingEnabled) {
      console.log(this.clientID, 'requesting document');
    }
    const message = {
      msgType: msgTypes.client.getDocument,
      fileID,
    };
    this.sendMessageToServer(JSON.stringify(message));
  }


  /**
   * @brief Initializes a WobSocket connection with the server.
   */
  connect() {
    this.WSClient = new WebSocketClient();
    const workspaceHash = 'testworkspace';
    const token = 'testclient';

    const that = this;
    this.WSClient.on('connect', function(connection) {
      if (that.loggingEnabled) {
        console.log(that.clientID, "[open] Connection established");
      }
      that.connection = connection;
      /*if (that.onConnectionCallback !== null) {
        that.onConnectionCallback(that.onConnectionCallbackArgument);
      }*/ 

      // send information about what workspace to access alongside an authentication token
      connection.on('message', function (messageWrapper) {
        let message = JSON.parse(messageWrapper.utf8Data);
        that.serverMessageProcessor(message);
      });

      const initMsg = {
        msgType: msgTypes.client.connect,
        token,
        workspaceHash,
      };
      connection.send(JSON.stringify(initMsg));
    });

    this.WSClient.connect(this.serverURL);
  }

  onMessageReceived(callback, argument) {
    this.onMessageCallback = callback;
    this.onMessageCallbackArgument = argument;
    return this;
  }

  onConnection(callback, argument) {
    this.onConnectionCallback = callback;
    this.onConnectionCallbackArgument = argument;
    return this;
  }
}

module.exports = Client;
