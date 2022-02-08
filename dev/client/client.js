const LISTEN_INTERVAL = 500; // how long will the editor listen before sending the data to others
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

class Editor extends React.Component {
    constructor(props) {
        super(props);
        this.processOperation = this.processOperation.bind(this);
        this.propagateLocalDif = this.propagateLocalDif.bind(this);
        this.intervalTimerStart = this.intervalTimerStart.bind(this);
        this.intervalBufClear = this.intervalBufClear.bind(this);
        this.intervalTimerCallback = this.intervalTimerCallback.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.serverMessageProcessor = this.serverMessageProcessor.bind(this);
        this.state = {
            editor: null,
            intervalBuf: [],
            measuring: false, // true for half a second after the user changed the state
            connection: null,
            clientID: null,
            commitSerialNumber: 0,

            //entry format: [[clientID, commitSerialNumber, preceding clientID, preceding commitSerialNumber], dif]
            HB: [],
            serverOrdering: [], // contains elements: [clientID, commitSerialNumber, prevclientID, prevCommitSerialNumber], where the information is taken from incoming messages
            firstSOMessageNumber: 0, // the total serial number of the first SO entry

            aceTheme: "ace/theme/chaos",
            aceMode: "ace/mode/javascript",

            role: roles.none
        };
    }

    intervalBufAddDif(dif) {
        this.intervalTimerStart(); // starts the timer
        this.setState((prevState) => ({
            intervalBuf: [...prevState.intervalBuf, ...dif],
        }));
        //logDif();
    }

    intervalBufClear() {
        this.setState((prevState) => ({
            intervalBuf: [],
        }));
    }

    intervalTimerStart() {
        if (this.state.measuring) {
            return;
        }

        this.setState((prevState) => ({
            measuring: true
        }));
        setTimeout(this.intervalTimerCallback, LISTEN_INTERVAL, this);
    }

    intervalTimerCallback(that) {
        that.setState((prevState) => ({
            measuring: false
        }));
        that.propagateLocalDif();
    }

    sendMessageToServer(messageString) {
        let that = this;
        setTimeout(function () {
            that.state.connection.send(messageString);
        }, CSLatency); // latency testing
    }

    propagateLocalDif() {
        let dif = to.compress(this.state.intervalBuf); // organise the dif
        this.intervalBufClear(); // clear the buffer for a new listening interval
        this.pushLocalDifToHB(dif); // push the dif into the history buffer and add the neccesary metadata

        let message = to.prim.deepCopy(this.HBGetLast());
        message[1] = to.prim.unwrapDif(message[1]);

        let messageString = JSON.stringify(message);
        this.sendMessageToServer(messageString);
    }

    /**
     * @brief Applies the changes the user want to make to the document state and send those changes to other users.
     */

    /**
     * @brief Pushed the dif to HB and adds the neccessary metadata.
     */
    pushLocalDifToHB(dif) {
        let prevClientID = (this.state.serverOrdering.length == 0) ? -1 : this.state.serverOrdering[this.state.serverOrdering.length - 1][0];
        let prevCommitSerialNumber = (this.state.serverOrdering.length == 0) ? -1 : this.state.serverOrdering[this.state.serverOrdering.length - 1][1];

        let wDif = to.prim.wrapDif(dif);

        this.setState((prevState) => ({
            HB: [...prevState.HB, [
                [prevState.clientID, prevState.commitSerialNumber, prevClientID, prevCommitSerialNumber], wDif
            ]],
            commitSerialNumber: prevState.commitSerialNumber + 1
        }));
    }

    /**
     * @returns Returns the last entry in HB.
     */
    HBGetLast() {
        return (this.state.HB[this.state.HB.length - 1]);
    }

    initializeDocument(message) {
        this.setState({
            clientID: message.clientID,
            HB: message.serverHB,
            serverOrdering: message.serverOrdering,
            firstSOMessageNumber: message.firstSOMessageNumber,
        });

        let document = new Document(this.state.editor.getSession().getDocument().getAllLines()); ///TODO: this should be a clean doc

        for (let i = 0; i < message.serverDocument.length; i++) {
            let line = (i == message.serverDocument.length - 1) ? message.serverDocument[i] : message.serverDocument[i] + "\n";
            document.insert({ row: i, column: 0 }, line);
        }

        this.state.editor.setSession(new EditSession(document));
        this.state.editor.session.on('change', this.handleChange);
        this.setEditorStyle();
    }

    sendGCMetadata() {
        let dependancy = -1; // value if there is no garbage

        if (this.state.serverOrdering.length > 0) {
            let lastEntry = this.state.serverOrdering[this.state.serverOrdering.length - 1];
            dependancy = this.state.serverOrdering.findIndex(entry => entry[0] === lastEntry[2] && entry[1] === lastEntry[3]);
            dependancy += this.state.firstSOMessageNumber; // so that the offset is correct
        }

        //console.log(this.serverOrdering);
        let message = {
            msgType: msgTypes.client.GCMetadataResponse,
            clientID: this.state.clientID,
            dependancy: dependancy
        };
        let messageString = JSON.stringify(message);
        this.sendMessageToServer(messageString);
    }

    GC(GCOldestMessageNumber) {
        let SOGarbageIndex = GCOldestMessageNumber - this.state.firstSOMessageNumber;

        if (SOGarbageIndex < 0 || SOGarbageIndex >= this.state.serverOrdering.length) {
            console.log("GC Bad SO index");
            return;
        }

        let GCClientID = this.state.serverOrdering[SOGarbageIndex][0];
        let GCCommitSerialNumber = this.state.serverOrdering[SOGarbageIndex][1];

        let HBGarbageIndex = 0;

        for (let i = 0; i < this.state.HB.length; i++) {
            let HBClientID = this.state.HB[i][0][0];
            let HBCommitSerialNumber = this.state.HB[i][0][1];
            if (HBClientID === GCClientID && HBCommitSerialNumber === GCCommitSerialNumber) {
                HBGarbageIndex = i;
                break;
            }
        }

        this.setState((prevState) => ({
            HB: prevState.HB.slice(HBGarbageIndex),
            serverOrdering: prevState.serverOrdering.slice(SOGarbageIndex),
            firstSOMessageNumber: prevState.firstSOMessageNumber + SOGarbageIndex
        }));
    }

    serverMessageProcessor(message) {
        let that = this;
        if (message.hasOwnProperty('msgType')) {
            if (message.msgType === msgTypes.server.initDocument) { ///TODO: what if this is lost somehow?
                this.initializeDocument(message);
            }
            else if (message.msgType === msgTypes.server.GCMetadataRequest) {
                this.sendGCMetadata();
            }
            else if (message.msgType === msgTypes.server.GC) {
                this.GC(message.GCOldestMessageNumber);
            }
            else if (message.msgType === msgTypes.server.initWorkspace) {
                ///TODO: process file structure
                ///note: after this, the client can interact with the workspace,
                ///      that means creating new files/folders and viewing files
                this.setState((prevState) => ({
                    role: message.role
                }));
                this.viewFile('document.txt'); ///TODO: this should not be here, it serves only as a mock
            }
            else {
                console.log("Received unknown message.", JSON.stringify(message));
            }
        }
        // message is an operation
        else {
            setTimeout(function () {
                that.processOperation(message);
            }, that.SCLatency); // latency testing
        }
    }

    /**
     * @brief Sends a request to the server to fetch a file.
     * 
     * @note Invoked after the user requests to view a file.
     * 
     * @param path The absolute path to the file
     */
    viewFile(path) {
        const message = {
            msgType: msgTypes.client.getDocument,
            path: path
        };
        this.sendMessageToServer(JSON.stringify(message));
    }

    /**
     * @brief Initializes a WobSocket connection with the server.
     */
    connect = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const workspaceHash = urlParams.get('hash');
        const token = urlParams.get('token');

        var connection = new WebSocket(SERVER_URL); ///TODO: protocol

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

            that.setState({
                connection: connection
            });

        };

        connection.onmessage = function (messageWrapper) {
            let message = JSON.parse(messageWrapper.data);
            //console.log("recv message obj", message_obj);
            //console.log("recv message", message.data);
            that.serverMessageProcessor(message);
        }
    }

    ///TODO: copy pasta
    setEditorStyle(editor = null) {
        if (editor !== null) {
            editor.setTheme(this.state.aceTheme);
            editor.session.setMode(this.state.aceMode);
            editor.session.on('change', this.handleChange);
            if (!roles.canEdit(this.state.role)) {
                editor.setReadOnly(true);
            }
            else {
                editor.setReadOnly(false);
            }
        }
        else {
            this.state.editor.setTheme(this.state.aceTheme);
            this.state.editor.session.setMode(this.state.aceMode);
            this.state.editor.session.on('change', this.handleChange);
            if (!roles.canEdit(this.state.role)) {
                this.state.editor.setReadOnly(true);
            }
            else {
                this.state.editor.setReadOnly(false);
            }
        }
    }

    /**
     * @brief Processes incoming server messages. If it is an external operation, executes it
       using the GOT control scheme.
  
     * @note Manages serverOrdering
     * 
     * @param message Operation send by the server
     */
    processOperation(message) {
        console.log('incoming message:');
        log(message);
        //let prevclientID = (this.state.HB.length == 0) ? -1 : this.state.HB[this.state.HB.length - 1][0][0];
        //let prevCommitSerialNumber = (this.state.HB.length == 0) ? -1 : this.state.HB[this.state.HB.length - 1][0][1];

        let authorID = message[0][0];

        // own message
        if (authorID === this.state.clientID) {
            this.setState((prevState) => ({
                serverOrdering: [...prevState.serverOrdering, [message[0][0], message[0][1], message[0][2], message[0][3]]] // append serverOrdering
            }));
        }
        // GOT control algorithm
        else {
            let oldCursorPosition = this.state.editor.getCursorPosition();
            let document = new Document(this.state.editor.getSession().getDocument().getAllLines());
            let finalState = to.UDR(message, document, this.state.HB, this.state.serverOrdering, false, oldCursorPosition);
            this.state.editor.setSession(new EditSession(finalState.document)); ///TODO: it might be a good idea to buffer changes
            this.state.editor.moveCursorTo(oldCursorPosition.row, oldCursorPosition.column);
            this.setEditorStyle();


            this.setState((prevState) => ({
                serverOrdering: [...prevState.serverOrdering, [message[0][0], message[0][1], message[0][2], message[0][3]]], // append serverOrdering
                HB: finalState.HB
            }));
        }
    }

    handleChange(e) {
        //console.log(e);
        console.log('handleChange');
        let dif = [];

        if (e.action === "insert") {
            // single line text
            if (e.lines.length === 1) {
                dif.push([e.start.row, e.start.column, e.lines[0]]);
            }

            // newline
            else if (e.lines.length === 2 && e.lines[0] === "" && e.lines[1] === "") {
                let trailingText = this.state.editor.session.getLine(e.end.row);
                dif.push(e.end.row); // add new row
                if (trailingText.length > 0) {
                    dif.push(to.move(e.start.row, e.start.column, e.end.row, 0, trailingText.length));
                }
            }

            // paste
            else {
                let trailingText = this.state.editor.session.getLine(e.start.row).substr(e.start.column);
                dif = to.textToDif(e.start.row, e.start.column, e.lines, trailingText);
            }
        }
        else if (e.action === "remove") {
            // single line text removal
            if (e.lines.length === 1) {
                dif.push([e.start.row, e.start.column, e.lines[0].length]);
            }

            // remline
            else if (e.lines.length === 2 && e.lines[0] === "" && e.lines[1] === "") {
                let trailingText = this.state.editor.session.getLine(e.start.row).substr(e.start.column);
                if (trailingText.length > 0) {
                    dif.push(to.move(e.end.row, 0, e.start.row, e.start.column, trailingText.length));
                }
                dif.push(-e.end.row);
            }

            // multiline delete
            else {
                dif.push(to.del(e.start.row, e.start.column, e.lines[0].length));
                for (let i = 1; i < e.lines.length - 1; i++) {
                    dif.push(to.del(e.start.row + i, 0, e.lines[i].length));
                }
                dif.push(to.del(e.end.row, 0, e.lines[e.lines.length - 1].length));
                let trailingText = this.state.editor.session.getLine(e.start.row).substr(e.start.column);
                dif.push(to.move(e.end.row, 0, e.start.row, e.start.column, trailingText.length));
                for (let i = e.end.row; i > e.start.row; i--) {
                    dif.push(to.remline(i));
                }
            }
        }
        if (dif.length === 0) console.log("handleChange dif is empty!");
        this.intervalBufAddDif(dif);
    }

    componentDidMount() {
        this.connect();


        let editor = ace.edit("editor");
        this.setEditorStyle(editor);

        this.setState((prevState) => ({
            editor: editor
        }));

    }

    render() {
        return (
            <div id="editor" className="editor"></div>
        );
    }
}

class Testing extends React.Component {
    constructor(props) {
        super(props);
        this.CSHandleChange = this.CSHandleChange.bind(this);
        this.SCHandleChange = this.SCHandleChange.bind(this);
    }

    /**
     * @note CS latency is implemented in the App.propagateLocalDif function
     */
    CSHandleChange(e) {
        CSLatency = e.target.value;
    }

    /**
     * @note SC latency is implemented in the App.connect onmessage event call
     */
    SCHandleChange(e) {
        SCLatency = e.target.value;
    }

    render() {
        return (
            <div>
                <h1>Testing</h1>
                <div>
                    <label className="mx-2 my-3" htmlFor="client-server">client -&gt; server latency (ms):</label>
                    <input className="text-right w-25" type="number" id="client-server" name="client-server" min="0" step="100" defaultValue={CSLatency} onChange={this.CSHandleChange}></input>
                </div>

                <div className="my-3">
                    <label className="mx-2" htmlFor="server-client">server -&gt; client latency (ms):</label>
                    <input className="text-right w-25" type="number" id="server-client" name="server-client" min="0" step="100" defaultValue={SCLatency} onChange={this.SCHandleChange}></input>
                </div>

                <div className="my-3">
                    <button type="button" className="btn btn-light" name="reverse" >NOT FUNCTIONAL</button>
                </div>
            </div>
        );
    }
}

class FileStructureDocument extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <li className="document" key={this.props.fileID.toString()}>
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
            <FileStructureDocument fileID={fileID} name={name} key={fileID + "a"} />
        );
    }

    createFolder(fileID, name, items) {
        return (
            <FileStructureFolder fileID={fileID} name={name} items={items} key={fileID + "a"} />
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
                <FileStructureFolder fileID="0" name="Workspace Name" items={this.props.fileStructure}/>
            </div>
        );
    }

}

class Workspace extends React.Component {
    constructor(props) {
        super(props);
        this.serverMessageProcessor = this.serverMessageProcessor.bind(this);
        this.state = {
            connectionWrapper: null,
            clientID: null,
            role: roles.none,
            fileStructure: null
        };
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

            const connectionWrapper = {
                connection: connection,
            }

            that.setState({
                connectionWrapper: connectionWrapper
            });

        };

        connection.onmessage = function (messageWrapper) {
            let message = JSON.parse(messageWrapper.data);
            //console.log("recv message obj", message_obj);
            //console.log("recv message", message.data);
            that.serverMessageProcessor(message);
        }
    }

    serverMessageProcessor(message) {
        const type = message.msgType;

        ///TODO: give operations a type or document their absence
        if (type === undefined && this.state.connectionWrapper.onOperation !== undefined) {
            this.state.connectionWrapper.onOperation(message);
        }
        else if (type === msgTypes.server.initialize && this.state.connectionWrapper.onInitialize !== undefined) {
            this.state.connectionWrapper.onInitialize(message);
        }
        else if (type === msgTypes.server.initWorkspace) {
            // this will rerender the FileStructure component
            this.setState((prevState) => ({
                role: message.role,
                fileStructure: message.fileStructure
            }));
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

    componentDidMount() {
        this.connect();
    }

    render() {
        return (
            <div className="main">
                <div className="headerBar"></div>
                <div id="leftBar">
                    <FileStructure role={this.state.role} fileStructure={this.state.fileStructure} />
                </div>

                <div className="content">
                    <Editor />
                </div>
            </div>
        );
    }
}

// ========================================

ReactDOM.render(
    <Workspace />,
    document.getElementById('reactContainer')
);
