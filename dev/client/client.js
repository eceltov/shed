const SERVER_URL = 'ws://localhost:8080/';
var CSLatency = 0;
var SCLatency = 0;
var Range = ace.require('ace/range').Range;
var EditSession = ace.require("ace/edit_session").EditSession;
var Document = ace.require("ace/document").Document;

function log(content) {
    console.log(JSON.parse(JSON.stringify(content)));
}

class Workspace extends React.Component {
    constructor(props) {
        super(props);
        this.sendMessageToServer = this.sendMessageToServer.bind(this);
        this.openDocument = this.openDocument.bind(this);
        this.closeDocument = this.closeDocument.bind(this);
        this.onOperation = this.onOperation.bind(this);
        this.onInitDocument = this.onInitDocument.bind(this);
        this.onInitWorkspace = this.onInitWorkspace.bind(this);
        this.onGCMetadataRequest = this.onGCMetadataRequest.bind(this);
        this.onGC = this.onGC.bind(this);
        this.mapFileNames = this.mapFileNames.bind(this);
        this.mountEditor = this.mountEditor.bind(this);
        this.getTabBar = this.getTabBar.bind(this);
        this.getWelcomeScreen = this.getWelcomeScreen.bind(this);
        this.state = {
            role: roles.none,
            fileStructure: null,
            activeTab: null, // fileID of active document
            tabs: [], // fileIDs in the same order as the final tabs
            aceTheme: "ace/theme/chaos",
            aceMode: "ace/mode/javascript",
        };

        this.connectionWrapper = {
            onInitWorkspace: this.onInitWorkspace, 
            onInitDocument: this.onInitDocument,
            onGCMetadataRequest: this.onGCMetadataRequest,
            onGC: this.onGC,
            onOperation: this.onOperation,
        };
        this.editor = null;
        this.clientID = null;
        this.requestedDocuments = new Set(); // contains fileIDs of documents requested from the server that did not arrive yet
        this.openedDocuments = new Map(); // maps fileIDs of documents to ManagedSessions
        this.fileNames = new Map(); // maps fileIDs to file names
        this.savedCommitSerialNumbers = new Map(); // maps fileIDs of closed documents to their next commitSerialNumbers (they cannot start again from 0)
    }

    /**
     * @brief Initializes a WobSocket connection with the server.
     */
     connect = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const workspaceHash = urlParams.get('hash');
        const token = urlParams.get('token');

        var connection = new WebSocket(SERVER_URL);

        ///TODO: use hooks instead of 'that'?
        let that = this;

        connection.onopen = function (e) {
            console.log("[open] Connection established");

            // send information about what workspace to access alongside an authentication token
            const initMsg = {
                msgType: msgTypes.client.connect,
                token: token,
                workspaceHash: workspaceHash
            };
            connection.send(JSON.stringify(initMsg));

            that.connectionWrapper.connection = connection;
        };

        connection.onmessage = function (messageWrapper) {
            let message = JSON.parse(messageWrapper.data);
            //console.log("recv message obj", message_obj);
            //console.log("recv message", message.data);
            that.serverMessageProcessor(message);
        }
    }

    /**
     * @brief Makes the target document the active editor tab. Will load from server if not loaded yet.
     * @param {*} fileID The ID of the document.
     */
    openDocument(fileID) {
        // if the document is opened, make that tab active
        if(this.openedDocuments.has(fileID)) {
            this.setState({
                activeTab: fileID
            });
        }
        // if the document is already requested, do nothing (wait for it)
        else if(this.requestedDocuments.has(fileID)) {
            ///TODO: do nothing? mby show a dialog that the request is being processed
        }
        // request the document from the server
        else {
            this.requestDocument(fileID);
            this.requestedDocuments.add(fileID);
        }
    }

    closeDocument(fileID) {
        if (!this.openedDocuments.has(fileID)) {
            console.log("Attempted to close unopened document.");
        }
        else {
            const message = {
                msgType: msgTypes.client.closeDocument,
                fileID: fileID
            };
            this.sendMessageToServer(JSON.stringify(message));

            const managedSession = this.openedDocuments.get(fileID);

            this.savedCommitSerialNumbers.set(fileID, managedSession.getNextCommitSerialNumber());
            this.openedDocuments.delete(fileID);

            let newTabs = to.prim.deepCopy(this.state.tabs);
            const index = newTabs.indexOf(fileID);
            if (index < 0) {
                console.log("Tabs do not contain the fileID to be removed. FileID:", fileID, "tabs:", newTabs);
                return;
            }
            newTabs.splice(index, 1);

            let newActiveTab = this.state.activeTab;
            if (this.state.activeTab === fileID) {
                if (newTabs.length > 0) {
                    newActiveTab = newTabs[0];
                }
                else {
                    newActiveTab = null;
                }
            }

            this.setState({
                tabs: newTabs,
                activeTab: newActiveTab
            });
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
            fileID: fileID
        };
        this.sendMessageToServer(JSON.stringify(message));
    }

    serverMessageProcessor(message) {
        console.log(JSON.stringify(message));
        const type = message.msgType;

        ///TODO: give operations a type or document their absence
        if (type === undefined && this.connectionWrapper.onOperation !== undefined) {
            this.connectionWrapper.onOperation(message);
        }
        else if (type === msgTypes.server.initialize && this.connectionWrapper.onInitialize !== undefined) {
            this.connectionWrapper.onInitialize(message);
        }
        else if (type === msgTypes.server.initWorkspace && this.connectionWrapper.onInitWorkspace !== undefined) {
            this.connectionWrapper.onInitWorkspace(message);
        }
        else if (type === msgTypes.server.initDocument && this.connectionWrapper.onInitDocument !== undefined) {
            this.connectionWrapper.onInitDocument(message);
        }
        else if (type === msgTypes.server.GCMetadataRequest && this.connectionWrapper.onGCMetadataRequest !== undefined) {
            this.connectionWrapper.onGCMetadataRequest(message);
        }
        else if (type === msgTypes.server.GC && this.connectionWrapper.onGC !== undefined) {
            this.connectionWrapper.onGC(message);
        }
        else if (type === msgTypes.server.createDocument && this.connectionWrapper.onCreateDocument !== undefined) {
            this.connectionWrapper.onCreateDocument(message);
        }
        else if (type === msgTypes.server.createFolder && this.connectionWrapper.onCreateFolder !== undefined) {
            this.connectionWrapper.onCreateFolder(message);
        }
        else if (type === msgTypes.server.deleteDocument && this.connectionWrapper.onDeleteDocument !== undefined) {
            this.connectionWrapper.onDeleteDocument(message);
        }
        else if (type === msgTypes.server.deleteFolder && this.connectionWrapper.onDeleteFolder !== undefined) {
            this.connectionWrapper.onDeleteFolder(message);
        }
        else if (type === msgTypes.server.renameFile && this.connectionWrapper.onRenameFile !== undefined) {
            this.connectionWrapper.onRenameFile(message);
        }
        else {
            console.log("Received unknown message type: " + JSON.stringify(message));
        }
    }

    onInitWorkspace(message) {
        // this will rerender the FileStructure component
        this.clientID = message.clientID;
        this.mapFileNames(message.fileStructure);
        this.setState({
            role: message.role,
            fileStructure: message.fileStructure
        });
    }

    /**
     * @brief Initializes the this.fileNames Map with file names from a fileStructure.
     * @param {*} fileStructure A file structure received from the server.
     */
    mapFileNames(fileStructure) {
        Object.entries(fileStructure).forEach((keyValuePair) => {
            this.fileNames.set(keyValuePair[1].ID, keyValuePair[0]);
            if (keyValuePair[1].type === "folder") {
                this.mapFileNames(keyValuePair[1].items);
            }
        });
    }

    sendMessageToServer(messageString) {
        let that = this;
        setTimeout(function () {
            that.connectionWrapper.connection.send(messageString);
        }, CSLatency); // latency testing
    }

    onInitDocument(message) {
        if (!this.requestedDocuments.has(message.fileID)) {
            console.log("The server sent an unrequested document, message: ", message);
        }
        else {
            this.requestedDocuments.delete(message.fileID);
            
            ///TODO: the mode should be determined based on the document type
            const session = new EditSession(message.serverDocument, this.state.aceMode);

            let commitSerialNumber = 0;
            if (this.savedCommitSerialNumbers.has(message.fileID)) {
                commitSerialNumber = this.savedCommitSerialNumbers.get(message.fileID);
            }
            
            const managedSession = new ManagedSession(session, this.clientID, message.fileID, commitSerialNumber, message.serverHB, message.serverOrdering, message.firstSOMessageNumber, this.sendMessageToServer);

            this.openedDocuments.set(message.fileID, managedSession);
            console.log("Set fileID:", message.fileID);
            this.setState((prevState) => ({
                tabs: [message.fileID, ...prevState.tabs],
                activeTab: message.fileID
            }));

            ///TODO: remove this
            //this.state.editor.setSession(session);
        }
    }

    onGCMetadataRequest(message) {
        if (!this.openedDocuments.has(message.fileID)) {
            console.log("Invalid GCMetadataRequest fileID:", message.fileID);
        }
        else {
            this.openedDocuments.get(message.fileID).sendGCMetadataResponse();
        }
    }

    onGC(message) {
        if (!this.openedDocuments.has(message.fileID)) {
            console.log("Invalid GC fileID:", message.fileID);
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
        let oldCursorPosition = this.editor.getCursorPosition();

        if (!this.openedDocuments.has(message[2])) {
            console.log("Invalid Operation fileID:", message[2]);
        }
        this.openedDocuments.get(message[2]).processOperation(message, oldCursorPosition);

        //this.state.editor.moveCursorTo(oldCursorPosition.row, oldCursorPosition.column);
    }

    getTabBar() {
        return (
            <TabBar
                tabs={this.state.tabs}
                activeTab={this.state.activeTab}
                fileNames={this.fileNames}
                openDocument={this.openDocument}
                closeDocument={this.closeDocument}
            />
        );
    }

    getWelcomeScreen() {
        return (
            <WelcomeScreen />
        )
    }

    mountEditor() {
        const editor = ace.edit("editor");
        editor.setTheme(this.state.aceTheme);
        editor.setReadOnly(true);
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
                <div className="headerBar"></div>
                <div id="leftBar">
                    <FileStructure
                        role={this.state.role}
                        fileStructure={this.state.fileStructure}
                        openDocument={this.openDocument}
                    />
                </div>

                <div className="content">
                    {this.state.activeTab === null ? this.getWelcomeScreen() : this.getTabBar()}
                    <div id="editor" hidden={this.state.activeTab === null}></div>
                </div>
            </div>
        );
    }
}

class WelcomeScreen extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="welcomeScreen">
            </div>
        );
    }
}

class TabBar extends React.Component {
    constructor(props) {
        super(props);
        this.createTab = this.createTab.bind(this);
    }

    createTab(fileID, index) {
        return (
            <Tab 
                key={fileID + "T"}
                fileID={fileID}
                active={fileID === this.props.activeTab}
                name={this.props.fileNames.get(fileID)}
                openDocument={this.props.openDocument}
                closeDocument={this.props.closeDocument}
                rightmost={index === this.props.tabs.length - 1}
            />
        );
    }

    render() {
        return (
            <div className="tabBar">
                {this.props.tabs.map((fileID, index) => this.createTab(fileID, index))}
            </div>
        );
    }
}

class Tab extends React.Component {
    constructor(props) {
        super(props);
        this.handleTabClick = this.handleTabClick.bind(this);
        this.handleCrossClick = this.handleCrossClick.bind(this);
        this.getClassName = this.getClassName.bind(this);
    }

    handleTabClick() {
        this.props.openDocument(this.props.fileID);
    }

    handleCrossClick(e) {
        e.preventDefault(); // stop propagating the click
        this.props.closeDocument(this.props.fileID);
    }

    getClassName() {
        let className = "tab";
        if (this.props.active) {
            className += " tabActive";
        }
        if (this.props.rightmost) {
            className += " tabRightmost";
        }
        return className;
    }

    render() {
        return (
            <div className={this.getClassName()}>
                <div className="tabContent" onClick={this.handleTabClick}>
                    {this.props.name}
                </div>
                <div className="tabClose" onClick={this.handleCrossClick} />
            </div>
            
        );
    }
}

class FileStructureDocument extends React.Component {
    constructor(props) {
        super(props);
        this.handleOnClick = this.handleOnClick.bind(this);
    }

    handleOnClick() {
        this.props.openDocument(this.props.fileID);
    }

    render() {
        return (
            <li onClick={this.handleOnClick} className="document">
                {this.props.name}
            </li>
        );
    }
}

class FileStructureFolder extends React.Component {
    constructor(props) {
        super(props);
    }

    createDocument(fileID, name) {
        return (
            <FileStructureDocument fileID={fileID} name={name} key={fileID + "a"} openDocument={this.props.openDocument} />
        );
    }

    createFolder(fileID, name, items) {
        return (
            <FileStructureFolder fileID={fileID} name={name} items={items} key={fileID + "a"} openDocument={this.props.openDocument} />
        );
    }

    createItem(file, name) {
        if(file.type === "doc") {
            return this.createDocument(file.ID, name);
        }
        else {
            return this.createFolder(file.ID, name, file.items);
        }
    }

    render() {
        return (
            <li>
                <input type="checkbox" id={this.props.fileID} className="folder"/> 
                <label htmlFor={this.props.fileID}>{this.props.name}</label>   
                <ul>
                    {this.props.items === null ? null : Object.entries(this.props.items).map((keyValuePair) => this.createItem(keyValuePair[1], keyValuePair[0]))}
                </ul>
            </li>
        );
    }
}

class FileStructure extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="fileStructure">
                <FileStructureFolder fileID="0" name="Workspace Name" items={this.props.fileStructure} key="0" openDocument={this.props.openDocument} />
            </div>
        );
    }
}

// ========================================

ReactDOM.render(
    <Workspace />,
    document.getElementById('reactContainer')
);
