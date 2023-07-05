const React = require('react');
const Cookies = require('js-cookie');
const FileStructure = require('./FileStructure');
const WelcomeScreen = require('./WelcomeScreen');
const TabBar = require('./TabBar');

const fsOps = require('../../lib/fileStructureOps');
const ManagedSession = require('../../lib/ManagedSession');
const msgFactory = require('../../lib/clientMessageFactory');
const { msgTypes } = require('../../lib/messageTypes');
const roles = require('../../lib/roles');
const workspaceAccessTypes = require('../../lib/workspaceAccessTypes');
const utils = require('../../lib/utils');
const HeaderBar = require('./HeaderBar');
const OptionsScreen = require('./OptionsScreen');
const Editor = require('./Editor');
const WaitingForInit = require('./ErrorComponents/WaitingForInit');

const CSLatency = 0;
const SCLatency = 0;
const webSocketReconnectDelay = 3000;
const modelist = ace.require('ace/ext/modelist');
// const Range = ace.require('ace/range').Range;
const EditSession = ace.require('ace/edit_session').EditSession;
// const Document = ace.require('ace/document').Document;

class Workspace extends React.Component {
  constructor(props) {
    super(props);
    this.connect = this.connect.bind(this);
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
    this.getTabBar = this.getTabBar.bind(this);
    this.showOptionsView = this.showOptionsView.bind(this);
    this.forceDocument = this.forceDocument.bind(this);
    this.addUserToWorkspace = this.addUserToWorkspace.bind(this);
    this.changeWorkspaceAccessType = this.changeWorkspaceAccessType.bind(this);
    this.state = {
      role: roles.none,
      accessType: workspaceAccessTypes.accessTypes.privileged,
      fileStructure: null,
      activeTab: null, // fileID of active document
      activeFile: fsOps.rootID, // set root as the default active file
      showingOptions: false,
      tabs: [], // fileIDs in the same order as the final tabs
      aceTheme: 'ace/theme/chaos',
      divergedDocuments: new Set(), // fileIDs of diverged documents
    };

    // eslint-disable-next-line react/no-unused-class-component-methods
    this.connection = null;
    this.editor = new Editor(this.state.aceTheme);
    this.clientID = null;

    /** contains fileIDs of documents requested from the server that did not arrive yet */
    this.requestedDocuments = new Set();
    this.openedDocuments = new Map(); // maps fileIDs of documents to ManagedSessions
    this.pathMap = new Map(); // maps fileIDs to ID file paths

    /** maps fileIDs of closed documents to their next commitSerialNumbers
     * (they cannot start again from 0) */
    this.savedCommitSerialNumbers = new Map();
  }

  /// TODO: the token should be removed from the URL in order to be sharable
  /// TODO: if the above is implemented, do not forget to store the token for reconnections
  /**
     * @brief Initializes a WobSocket connection with the server.
     */
  connect() {
    const urlParams = new URLSearchParams(window.location.search);
    const workspaceHash = urlParams.get('hash');

    // use default value "" for guest users
    const token = utils.getCookie('jwt') ?? "";

    // redirect user to login screen if unauthenticated
    // this was removed so that unauthenticated users can join workspaces that support them
    /*if (!token) {
      window.location.href = '/';
    }*/

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

    connection.onclose = function onclose(e) {
      console.log('WebSocket closed. Reconnecting...');
      setTimeout(() => that.connect(), webSocketReconnectDelay);
    };

    connection.onerror = function onerror(err) {
      console.error('WebSocket error.');
      connection.close();
    };
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
        showingOptions: false,
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
        // set default ID to the root so that creation of new files works intuitively
        // (else the client would have to click on a folder/document if activeFile would equal null)
        newActiveFile = fsOps.rootID;
      }
    }

    if (stateSnapshot === null) {
      this.setState({
        tabs: newTabs,
        activeTab: newActiveTab,
        activeFile: newActiveFile,
        showingOptions: false,
      });
    }
    else {
      stateSnapshot.tabs = newTabs;
      stateSnapshot.activeTab = newActiveTab;
      stateSnapshot.activeFile = newActiveFile;
      stateSnapshot.showingOptions = false;
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
    const message = msgFactory.getDocument(fileID);
    this.sendMessageToServer(JSON.stringify(message));
  }

  // eslint-disable-next-line react/no-unused-class-component-methods
  serverMessageProcessor(message) {
    console.log('Received message:', JSON.stringify(message));
    const type = message.msgType;

    switch (type) {
      case undefined:
        this.onOperation(message);
        break;
      case msgTypes.server.initWorkspace:
        this.onInitWorkspace(message);
        break;
      case msgTypes.server.initDocument:
        this.onInitDocument(message);
        break;
      case msgTypes.server.GCMetadataRequest:
        this.onGCMetadataRequest(message);
        break;
      case msgTypes.server.GC:
        this.onGC(message);
        break;
      case msgTypes.server.createDocument:
        this.onCreateDocument(message);
        break;
      case msgTypes.server.createFolder:
        this.onCreateFolder(message);
        break;
      case msgTypes.server.deleteDocument:
        this.onDeleteDocument(message);
        break;
      case msgTypes.server.deleteFolder:
        this.onDeleteFolder(message);
        break;
      case msgTypes.server.renameFile:
        this.onRenameFile(message);
        break;
      case msgTypes.server.failedValidation:
        this.onFailedvalidation(message);
        break;
      case msgTypes.server.divergenceDetected:
        this.onDivergenceDetected(message);
        break;
      case msgTypes.server.forceDocument:
        this.onForceDocument(message);
        break;
      case msgTypes.server.changeWorkspaceAccessType:
        this.onChangeWorkspaceAccessType(message);
        break;
      default:
        console.error('Invalid message type. Message:', JSON.stringify(message));
    }
  }

  onFailedvalidation(message) {
    this.connection.close();
    console.log('[closed] Connection closed');
    window.alert('Error: Invalid authentication token sent to server. Please log in again.');
    /// TODO: change the background to an error view
  }

  onInitWorkspace(message) {
    // this will rerender the FileStructure component
    this.clientID = message.clientID;
    this.pathMap = fsOps.getIDPathMap(message.fileStructure);
    this.setState({
      role: message.role,
      accessType: message.accessType,
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
        session, this.clientID, commitSerialNumber, this.sendMessageToServer, message, this.editor.setReadOnly,
      );

      this.openedDocuments.set(message.fileID, managedSession);
      this.setState((prevState) => ({
        tabs: [message.fileID, ...prevState.tabs],
        activeTab: message.fileID,
        showingOptions: false,
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
    /// TODO: unused cursor position
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

      if (message.fileID === stateSnapshot.activeFile) {
        stateSnapshot.activeFile = fsOps.rootID;
      }

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

  onDivergenceDetected(message) {
    this.setState((prevState) => {
      // do not change anything if the diverged document is already known
      if (prevState.divergedDocuments.has(message.fileID)) {
        return {};
      }

      const divergedDocuments = new Set(prevState.divergedDocuments);
      divergedDocuments.add(message.fileID);
      return {
        divergedDocuments,
      };
    });
  }

  onChangeWorkspaceAccessType(message) {
    this.setState({
      accessType: message.accessType,
    });
  }

  onForceDocument(message) {
    // create a new managed session that has no history
    const name = fsOps.getFileNameFromID(this.state.fileStructure, this.pathMap, message.fileID);
    const mode = modelist.getModeForPath(name).mode;
    const session = new EditSession(message.serverDocument, mode);

    const initObj = {
      fileID: message.fileID,
      serverHB: [],
      serverOrdering: [],
      firstSOMessageNumber: 0,
    };

    const managedSession = new ManagedSession(
      session, this.clientID, 0, this.sendMessageToServer, initObj, this.editor.setReadOnly,
    );

    // reset the saved commit serial number, as the editing session starts anew
    this.savedCommitSerialNumbers.set(message.fileID, 0);

    // disable the old ManagedSession
    this.openedDocuments.get(message.fileID).disable();

    // replace old ManagedSession with the new one
    this.openedDocuments.set(message.fileID, managedSession);

    // remove the document from the diverged set
    // the rerender will automatically mount the new session, if the old one was active
    this.setState((prevState) => {
      const divergedDocuments = new Set(prevState.divergedDocuments);
      divergedDocuments.delete(message.fileID);
      return {
        divergedDocuments,
      };
    });
  }

  forceDocument(fileID) {
    const managedSession = this.openedDocuments.get(fileID);
    ///TODO: test if this works, then make this into a method of ManagedSession
    const document = managedSession.session.getDocument().getAllLines();

    const message = msgFactory.forceDocument(fileID, document);
    this.sendMessageToServer(JSON.stringify(message));
  }

  showOptionsView() {
    this.setState((prevState) => ({
      activeTab: null,
      showingOptions: true,
    }));
  }

  componentDidMount() {
    this.connect();
    this.editor.mount();
  }

  addUserToWorkspace(username, role) {
    const message = msgFactory.addUserToWorkspace(username, role);
    this.sendMessageToServer(JSON.stringify(message));
  }

  changeWorkspaceAccessType(accessType) {
    const message = msgFactory.changeWorkspaceAccessType(accessType);
    this.sendMessageToServer(JSON.stringify(message));
  }

  renderContent() {
    // welcome view
    if (this.state.tabs.length === 0 && !this.state.showingOptions) {
      return (
        <div className="content">
          <WelcomeScreen />
          <div id="editor" key="0" hidden={this.state.activeTab === null} />
        </div>
      );
    }

    // options view
    if (this.state.showingOptions) {
      return (
        <div className="content">
          {this.state.tabs.length > 0 ? this.getTabBar() : null}
          <OptionsScreen
            addUserToWorkspace={this.addUserToWorkspace}
            changeWorkspaceAccessType={this.changeWorkspaceAccessType}
            accessType={this.state.accessType}
            role={this.state.role}
          />
          <div id="editor" key="0" hidden={this.state.activeTab === null} />
        </div>
      );
    }

    // document view
    return (
      <div className="content">
        {this.getTabBar()}
        <div id="editor" key="0" hidden={this.state.activeTab === null} />
      </div>
    );
  }

  renderFileStructure() {
    if (this.state.fileStructure === null) {
      return (
        <WaitingForInit />
      );
    }

    return (
      <FileStructure
        sendMessageToServer={this.sendMessageToServer}
        fileStructure={this.state.fileStructure}
        pathMap={this.pathMap}
        activeFile={this.state.activeFile}
        selectFile={this.selectFile}
        divergedDocuments={this.state.divergedDocuments}
        forceDocument={this.forceDocument}
        userCanEdit={roles.canEdit(this.state.role)}
      />
    );
  }

  render() {
    // set readonly if necessary and mount correct session
    if (this.state.activeTab !== null && this.editor.mounted) {
      this.editor.setSession(this.openedDocuments.get(this.state.activeTab).getSession());

      if (!roles.canEdit(this.state.role) || this.state.divergedDocuments.has(this.state.activeTab)) {
        this.editor.setReadOnly(true);
      }
      else {
        this.editor.setReadOnly(false);
      }
    }

    return (
      <div className="main">
        <HeaderBar showOptionsView={this.showOptionsView} />
        <div id="leftBar">
          {this.renderFileStructure()}
        </div>

        {this.renderContent()}
      </div>
    );
  }
}

module.exports = Workspace;
