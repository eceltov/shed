const React = require('react');
const FileStructure = require('./FileStructure');
const WelcomeScreen = require('./WelcomeScreen');
const TabBar = require('./TabBar');

const fsOps = require('../lib/fileStructureOps');
const ManagedSession = require('../lib/ManagedSession');
const msgFactory = require('../lib/clientMessageFactory');
const { msgTypes } = require('../lib/messageTypes');
const roles = require('../lib/roles');
const utils = require('../lib/utils');

const CSLatency = 0;
const SCLatency = 0;
const modelist = ace.require('ace/ext/modelist');
// const Range = ace.require('ace/range').Range;
const EditSession = ace.require('ace/edit_session').EditSession;
// const Document = ace.require('ace/document').Document;

class Workspace extends React.Component {
  constructor(props) {
    super(props);
    this.setReadOnly = this.setReadOnly.bind(this);
    this.sendMessageToServer = this.sendMessageToServer.bind(this);
    this.selectFile = this.selectFile.bind(this);
    this.openDocument = this.openDocument.bind(this);
    this.closeDocument = this.closeDocument.bind(this);
    this.onOperation = this.onOperation.bind(this);
    this.onInitDocument = this.onInitDocument.bind(this);
    this.onRenameFile = this.onRenameFile.bind(this);
    this.onInitWorkspace = this.onInitWorkspace.bind(this);
    this.onGCMetadataRequest = this.onGCMetadataRequest.bind(this);
    this.onGC = this.onGC.bind(this);
    this.mountEditor = this.mountEditor.bind(this);
    this.getTabBar = this.getTabBar.bind(this);
    this.createDocument = this.createDocument.bind(this);
    this.createFolder = this.createFolder.bind(this);
    this.deleteDocument = this.deleteDocument.bind(this);
    this.deleteFolder = this.deleteFolder.bind(this);
    this.deleteFile = this.deleteFile.bind(this);
    this.renameFile = this.renameFile.bind(this);
    this.state = {
      role: roles.none,
      fileStructure: null,
      activeTab: null, // fileID of active document
      activeFile: null,
      tabs: [], // fileIDs in the same order as the final tabs
      aceTheme: 'ace/theme/chaos',
    };

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
  }

  /**
     * @brief Initializes a WobSocket connection with the server.
     */
  connect = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const workspaceHash = urlParams.get('hash');
    const token = urlParams.get('token');

    // WebSocketServerURL is injected into a script tag in SSR
    const connection = new WebSocket(WebSocketServerURL);

    /// TODO: use hooks instead of 'that'?
    const that = this;

    connection.onopen = function onopen(e) {
      console.log('[open] Connection established');

      // send information about what workspace to access alongside an authentication token
      const initMsg = {
        msgType: msgTypes.client.connect,
        token,
        workspaceHash,
      };
      connection.send(JSON.stringify(initMsg));

      that.connection = connection;
    };

    connection.onmessage = function onmessage(messageWrapper) {
      const message = JSON.parse(messageWrapper.data);
      // console.log("recv message obj", message_obj);
      // console.log("recv message", message.data);
      that.serverMessageProcessor(message);
    };
  };

  setReadOnly(readOnly) {
    const state = this.editor.getOption('readOnly');
    this.editor.setOption('readOnly', readOnly);
    return state;
  }

  /**
     * @brief Highlights the selected file in the fileStructure and makes it the active tab,
     *  if it is a document.
     * @note Should be called after the user clicks on a file in the file structure.
     * @param {*} fileID The ID of the file.
     */
  selectFile(fileID) {
    if (this.state.activeFile === fileID) {
      return;
    }

    if (this.pathMap.has(fileID)
        && fsOps.isDocument(this.state.fileStructure, this.pathMap, fileID)
    ) {
      this.openDocument(fileID);
    }

    this.setState({
      activeFile: fileID,
    });
  }

  /**
     * @brief Makes the target document the active editor tab.
     *  Will load from server if not loaded yet.
     * @param {*} fileID The ID of the document.
     */
  openDocument(fileID) {
    // if the document is opened, make that tab active
    if (this.openedDocuments.has(fileID)) {
      this.setState({
        activeTab: fileID,
        activeFile: fileID,
      });
    }
    // if the document is already requested, do nothing (wait for it)
    else if (this.requestedDocuments.has(fileID)) {
      /// TODO: do nothing? mby show a dialog that the request is being processed
    }
    // request the document from the server
    else {
      this.requestDocument(fileID);
      this.requestedDocuments.add(fileID);
    }
  }

  closeDocument(fileID) {
    if (!this.openedDocuments.has(fileID)) {
      console.log('Attempted to close unopened document.');
    }
    else {
      this.destroyDocumentInstance(fileID);
      this.closeTab(fileID);
    }
  }

  /**
     * @brief Closes the specified tab, selects a new tab and file to be active.
     * @param {*} fileID The ID of the document to be closed.
     * @param {*} stateSnapshot If specified, the function will not change the state but
     *  the one provided.
     */
  closeTab(fileID, stateSnapshot = null) {
    let state = this.state;
    if (stateSnapshot !== null) {
      state = stateSnapshot;
    }

    const newTabs = utils.deepCopy(state.tabs);
    const index = newTabs.indexOf(fileID);
    if (index < 0) {
      return;
    }
    newTabs.splice(index, 1);

    let newActiveTab = state.activeTab;
    let newActiveFile = state.activeFile;
    if (state.activeTab === fileID) {
      if (newTabs.length > 0) {
        newActiveTab = newTabs[0];
        newActiveFile = newActiveTab;
      }
      else {
        newActiveTab = null;
        newActiveFile = null;
      }
    }

    if (stateSnapshot === null) {
      this.setState({
        tabs: newTabs,
        activeTab: newActiveTab,
        activeFile: newActiveFile,
      });
    }
    else {
      stateSnapshot.tabs = newTabs;
      stateSnapshot.activeTab = newActiveTab;
      stateSnapshot.activeFile = newActiveFile;
    }
  }

  /**
     * @brief Destroys a ManagedSession and sends the server a message to
     *  close the document connection.
     * @note The message will be sent after a delay, so that all staged operations will
     *  be send to the server.
     * @note Saves the commitSerialNumber.
     * @param {*} fileID
     */
  destroyDocumentInstance(fileID) {
    const managedSession = this.openedDocuments.get(fileID);
    if (managedSession === undefined) {
      return;
    }

    this.savedCommitSerialNumbers.set(fileID, managedSession.getNextCommitSerialNumber());

    const that = this;
    // wait for the messages in buffer to be sent
    setTimeout(() => {
      const message = {
        msgType: msgTypes.client.closeDocument,
        fileID,
      };
      that.sendMessageToServer(JSON.stringify(message));
      that.openedDocuments.delete(fileID);
    }, managedSession.getListenInterval() + 100);
  }

  destroyDocumentInstanceSilentFast(fileID) {
    const managedSession = this.openedDocuments.get(fileID);
    if (managedSession !== undefined) {
      this.savedCommitSerialNumbers.set(fileID, managedSession.getNextCommitSerialNumber());
      this.openedDocuments.delete(fileID);
    }
  }

  /**
     * @brief Sends a request to the server to fetch a file.
     *
     * @note Invoked after the user requests to view a file.
     *
     * @param fileID The ID of a document.
     */
  requestDocument(fileID) {
    const message = {
      msgType: msgTypes.client.getDocument,
      fileID,
    };
    this.sendMessageToServer(JSON.stringify(message));
  }

  // eslint-disable-next-line react/no-unused-class-component-methods
  serverMessageProcessor(message) {
    console.log('Received message:', JSON.stringify(message));
    const type = message.msgType;

    if (type === undefined) {
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
    else if (type === msgTypes.server.createDocument) {
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
    }
    else {
      console.log(`Received unknown message type: ${JSON.stringify(message)}`);
    }
  }

  onInitWorkspace(message) {
    // this will rerender the FileStructure component
    this.clientID = message.clientID;
    this.pathMap = fsOps.getIDPathMap(message.fileStructure);
    this.setState({
      role: message.role,
      fileStructure: message.fileStructure,
      activeFile: message.fileStructure.ID,
    });
  }

  sendMessageToServer(messageString) {
    console.log('Sending message to server:', messageString);
    const that = this;
    setTimeout(() => {
      that.connection.send(messageString);
    }, CSLatency); // latency testing
  }

  onInitDocument(message) {
    if (!this.requestedDocuments.has(message.fileID)) {
      console.log('The server sent an unrequested document, message: ', message);
    }
    else {
      this.requestedDocuments.delete(message.fileID);

      const name = fsOps.getFileNameFromID(this.state.fileStructure, this.pathMap, message.fileID);
      const mode = modelist.getModeForPath(name).mode;
      const session = new EditSession(message.serverDocument, mode);

      // check if a commitSerialNumber exists for this document
      let commitSerialNumber = 0;
      if (this.savedCommitSerialNumbers.has(message.fileID)) {
        commitSerialNumber = this.savedCommitSerialNumbers.get(message.fileID);
      }

      const managedSession = new ManagedSession(
        session, this.clientID, commitSerialNumber, this.sendMessageToServer, message, this.setReadOnly,
      );

      this.openedDocuments.set(message.fileID, managedSession);
      this.setState((prevState) => ({
        tabs: [message.fileID, ...prevState.tabs],
        activeTab: message.fileID,
      }));
    }
  }

  onGCMetadataRequest(message) {
    if (!this.openedDocuments.has(message.fileID)) {
      console.log('Invalid GCMetadataRequest fileID:', message.fileID);
    }
    else {
      this.openedDocuments.get(message.fileID).sendGCMetadataResponse();
    }
  }

  onGC(message) {
    if (!this.openedDocuments.has(message.fileID)) {
      console.log('Invalid GC fileID:', message.fileID);
    }
    else {
      this.openedDocuments.get(message.fileID).GC(message);
    }
  }

  /**
     * @brief Processes incoming server messages. If it is an external operation, executes it
       using the GOT control scheme.

     * @note Manages serverOrdering
     *
     * @param message Operation send by the server
     */
  onOperation(message) {
    const oldCursorPosition = this.editor.getCursorPosition();

    if (!this.openedDocuments.has(message[2])) {
      console.log('Invalid Operation fileID:', message[2]);
    }
    this.openedDocuments.get(message[2]).processOperation(message, oldCursorPosition);

    // this.state.editor.moveCursorTo(oldCursorPosition.row, oldCursorPosition.column);
  }

  getTabBar() {
    return (
      <TabBar
        tabs={this.state.tabs}
        activeTab={this.state.activeTab}
        fileStructure={this.state.fileStructure}
        pathMap={this.pathMap}
        openDocument={this.openDocument}
        closeDocument={this.closeDocument}
      />
    );
  }

  createDocument(name) {
    const parentID = fsOps.getSpawnParentID(
      this.state.fileStructure, this.pathMap, this.state.activeFile,
    );
    const message = msgFactory.createDocument(this.state.clientID, parentID, name);
    this.sendMessageToServer(JSON.stringify(message));
  }

  createFolder(name) {
    const parentID = fsOps.getSpawnParentID(
      this.state.fileStructure, this.pathMap, this.state.activeFile,
    );
    const message = msgFactory.createFolder(this.state.clientID, parentID, name);
    this.sendMessageToServer(JSON.stringify(message));
  }

  deleteDocument() {
    const message = msgFactory.deleteDocument(this.state.clientID, this.state.activeFile);
    this.sendMessageToServer(JSON.stringify(message));
  }

  deleteFolder() {
    const message = msgFactory.deleteFolder(this.state.clientID, this.state.activeFile);
    this.sendMessageToServer(JSON.stringify(message));
  }

  deleteFile() {
    const fileObj = fsOps.getFileObject(
      this.state.fileStructure, this.pathMap, this.state.activeFile,
    );
    if (fileObj !== null && fileObj.type === fsOps.types.document) {
      this.deleteDocument();
    }
    else if (fileObj !== null && fileObj.type === fsOps.types.folder) {
      this.deleteFolder();
    }
    else {
      console.log('Deleting unknown file:', fileObj);
    }
  }

  renameFile(newName) {
    const name = fsOps.getFileNameFromID(
      this.state.fileStructure, this.pathMap, this.state.activeFile,
    );
    if (name !== newName) {
      const message = msgFactory.renameFile(this.state.clientID, this.state.activeFile, newName);
      this.sendMessageToServer(JSON.stringify(message));
    }
  }

  onCreateDocument(message) {
    this.setState((prevState) => {
      const fileStructureCopy = utils.deepCopy(prevState.fileStructure);
      const documentObj = fsOps.getNewDocumentObj(message.fileID, message.name);
      fsOps.addFile(fileStructureCopy, this.pathMap, message.parentID, documentObj);

      return {
        fileStructure: fileStructureCopy,
      };
    });
  }

  onCreateFolder(message) {
    this.setState((prevState) => {
      const fileStructureCopy = utils.deepCopy(prevState.fileStructure);
      const folderObj = fsOps.getNewFolderObj(message.fileID, message.name);
      fsOps.addFile(fileStructureCopy, this.pathMap, message.parentID, folderObj);

      return {
        fileStructure: fileStructureCopy,
      };
    });
  }

  onDeleteDocument(message) {
    this.setState((prevState) => {
      const stateSnapshot = {
        tabs: utils.deepCopy(prevState.tabs),
        activeFile: prevState.activeFile,
        activeTab: prevState.activeTab,
        fileStructure: utils.deepCopy(prevState.fileStructure),
      };

      fsOps.removeFile(stateSnapshot.fileStructure, this.pathMap, message.fileID);
      this.closeTab(message.fileID, stateSnapshot);
      this.destroyDocumentInstanceSilentFast();

      return stateSnapshot;
    });
  }

  onDeleteFolder(message) {
    this.setState((prevState) => {
      const stateSnapshot = {
        tabs: utils.deepCopy(prevState.tabs),
        activeFile: prevState.activeFile,
        activeTab: prevState.activeTab,
        fileStructure: utils.deepCopy(prevState.fileStructure),
      };

      const folderObj = fsOps.getFileObject(
        stateSnapshot.fileStructure, this.pathMap, message.fileID,
      );
      if (folderObj === null) {
        return {};
      }

      this.recursiveFileDelete(folderObj, stateSnapshot);

      return stateSnapshot;
    });
  }

  recursiveFileDelete(fileObj, stateSnapshot) {
    if (fileObj.type === fsOps.types.document) {
      fsOps.removeFile(stateSnapshot.fileStructure, this.pathMap, fileObj.ID);
      this.closeTab(fileObj.ID, stateSnapshot);
      this.destroyDocumentInstanceSilentFast();
    }
    else if (fileObj.type === fsOps.types.folder) {
      Object.values(fileObj.items).forEach((nestedFileObj) => {
        this.recursiveFileDelete(nestedFileObj, stateSnapshot);
      });
      fsOps.removeFile(stateSnapshot.fileStructure, this.pathMap, fileObj.ID);
    }
  }

  onRenameFile(message) {
    this.setState((prevState) => {
      const fileStructureCopy = utils.deepCopy(prevState.fileStructure);
      fsOps.renameFile(fileStructureCopy, this.pathMap, message.fileID, message.name);

      // change the file ace mode if the extension changed
      if (this.openedDocuments.has(message.fileID)) {
        const newMode = modelist.getModeForPath(message.name).mode;
        const managedSession = this.openedDocuments.get(message.fileID);
        managedSession.setMode(newMode);
      }

      return {
        fileStructure: fileStructureCopy,
      };
    });
  }

  mountEditor() {
    const editor = ace.edit('editor');
    editor.setTheme(this.state.aceTheme);
    editor.setReadOnly(true);
    editor.setOptions({
      fontSize: '12pt',
      printMarginColumn: 100,
    });
    this.editor = editor;
  }

  componentDidMount() {
    this.connect();
    this.mountEditor();
  }

  render() {
    // set readonly if neccessarry and mount correct session
    if (this.state.activeTab !== null && this.editor !== null) {
      this.editor.setSession(this.openedDocuments.get(this.state.activeTab).getSession());

      if (!roles.canEdit(this.state.role)) {
        this.editor.setReadOnly(true);
      }
      else {
        this.editor.setReadOnly(false);
      }
    }

    return (
      <div className="main">
        <div className="headerBar" />
        <div id="leftBar">
          <FileStructure
            fileStructure={this.state.fileStructure}
            pathMap={this.pathMap}
            activeFile={this.state.activeFile}
            selectFile={this.selectFile}
            createDocument={this.createDocument}
            createFolder={this.createFolder}
            deleteFile={this.deleteFile}
            renameFile={this.renameFile}
          />
        </div>

        <div className="content">
          {this.state.activeTab === null ? <WelcomeScreen /> : this.getTabBar()}
          <div id="editor" hidden={this.state.activeTab === null} />
        </div>
      </div>
    );
  }
}

module.exports = Workspace;
