/// How to propagate the target server to the client?
//const SERVER_URL = 'ws://dev.lan:8080/';
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
        this.onOperation = this.onOperation.bind(this);
        this.onInitDocument = this.onInitDocument.bind(this);
        this.onInitWorkspace = this.onInitWorkspace.bind(this);
        this.onGCMetadataRequest = this.onGCMetadataRequest.bind(this);
        this.onGC = this.onGC.bind(this);
        this.state = {
            connectionWrapper: {
                onInitWorkspace: this.onInitWorkspace, 
                onInitDocument: this.onInitDocument,
                onGCMetadataRequest: this.onGCMetadataRequest,
                onGC: this.onGC,
                onOperation: this.onOperation,
            },
            clientID: null,
            role: roles.none,
            fileStructure: null,
            editor: null,
            aceTheme: "ace/theme/chaos",
            aceMode: "ace/mode/javascript",
        };

        this.requestedDocuments = new Set(); // contains fileIDs of documents requested from the server that did not arrive yet
        this.openedDocuments = new Map(); // maps fileIDs of documents to ManagedSessions
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

            that.state.connectionWrapper.connection = connection;
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
        if(this.openedDocuments.has(fileID)) {
            ///TODO: make that tab active
        }
        else if(this.requestedDocuments.has(fileID)) {
            ///TODO: do nothing? mby show a dialog that the request is being processed
        }
        else {
            this.requestDocument(fileID);
            this.requestedDocuments.add(fileID);
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
        if (type === undefined && this.state.connectionWrapper.onOperation !== undefined) {
            this.state.connectionWrapper.onOperation(message);
        }
        else if (type === msgTypes.server.initialize && this.state.connectionWrapper.onInitialize !== undefined) {
            this.state.connectionWrapper.onInitialize(message);
        }
        else if (type === msgTypes.server.initWorkspace && this.state.connectionWrapper.onInitWorkspace !== undefined) {
            this.state.connectionWrapper.onInitWorkspace(message);
        }
        else if (type === msgTypes.server.initDocument && this.state.connectionWrapper.onInitDocument !== undefined) {
            this.state.connectionWrapper.onInitDocument(message);
        }
        else if (type === msgTypes.server.GCMetadataRequest && this.state.connectionWrapper.onGCMetadataRequest !== undefined) {
            this.state.connectionWrapper.onGCMetadataRequest(message);
        }
        else if (type === msgTypes.server.GC && this.state.connectionWrapper.onGC !== undefined) {
            this.state.connectionWrapper.onGC(message);
        }
        else if (type === msgTypes.server.createDocument && this.state.connectionWrapper.onCreateDocument !== undefined) {
            this.state.connectionWrapper.onCreateDocument(message);
        }
        else if (type === msgTypes.server.createFolder && this.state.connectionWrapper.onCreateFolder !== undefined) {
            this.state.connectionWrapper.onCreateFolder(message);
        }
        else if (type === msgTypes.server.deleteDocument && this.state.connectionWrapper.onDeleteDocument !== undefined) {
            this.state.connectionWrapper.onDeleteDocument(message);
        }
        else if (type === msgTypes.server.deleteFolder && this.state.connectionWrapper.onDeleteFolder !== undefined) {
            this.state.connectionWrapper.onDeleteFolder(message);
        }
        else if (type === msgTypes.server.renameFile && this.state.connectionWrapper.onRenameFile !== undefined) {
            this.state.connectionWrapper.onRenameFile(message);
        }
        else {
            console.log("Received unknown message type: " + JSON.stringify(message));
        }
    }

    onInitWorkspace(message) {
        // this will rerender the FileStructure component
        this.setState({
            clientID: message.clientID,
            role: message.role,
            fileStructure: message.fileStructure
        });
    }

    sendMessageToServer(messageString) {
        let that = this;
        setTimeout(function () {
            that.state.connectionWrapper.connection.send(messageString);
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
            
            const managedSession = new ManagedSession(session, this.state.clientID, message.fileID, commitSerialNumber, message.serverHB, message.serverOrdering, message.firstSOMessageNumber, this.sendMessageToServer);

            this.openedDocuments.set(message.fileID, managedSession);

            ///TODO: remove this
            this.state.editor.setSession(session);
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
        let oldCursorPosition = this.state.editor.getCursorPosition();

        if (!this.openedDocuments.has(message[2])) {
            console.log("Invalid Operation fileID:", message[2]);
        }
        this.openedDocuments.get(message[2]).processOperation(message, oldCursorPosition);

        //this.state.editor.moveCursorTo(oldCursorPosition.row, oldCursorPosition.column);
    }

    componentDidMount() {
        this.connect();

        const editor = ace.edit("editor");
        editor.setTheme(this.state.aceTheme);
        editor.setReadOnly(true);

        this.setState({
            editor: editor
        });
    }

    render() {
        // set readonly if neccessarry
        if (this.state.editor !== null) {
            if (!roles.canEdit(this.state.role)) {
                this.state.editor.setReadOnly(true);
            }
            else {
                this.state.editor.setReadOnly(false);
            }
        }

        return (
            <div className="main">
                <div className="headerBar"></div>
                <div id="leftBar">
                    <FileStructure role={this.state.role} fileStructure={this.state.fileStructure} openDocument={this.openDocument} />
                </div>

                <div className="content">
                    <div id="editor" className="editor"></div>
                </div>
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
            <li onClick={this.handleOnClick} className="document" key={this.props.fileID.toString()}>
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
            <li key={this.props.fileID.toString()}>
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
