const LISTEN_INTERVAL = 500; // how long will the editor listen before sending the data to others
const SERVER_URL = 'ws://dev.lan:8080/';
var CSLatency = 0;
var SCLatency = 0;
var Range = ace.require('ace/range').Range;
var EditSession = ace.require("ace/edit_session").EditSession;
var Document = ace.require("ace/document").Document;

function log(content) {
    console.log(JSON.parse(JSON.stringify(content)));
}

class Client extends React.Component {
    constructor(props) {
        super(props);
        this.processIncomingMessage = this.processIncomingMessage.bind(this);
        this.propagateLocalDif = this.propagateLocalDif.bind(this);
        this.intervalTimerStart = this.intervalTimerStart.bind(this);
        this.intervalBufClear = this.intervalBufClear.bind(this);
        this.intervalTimerCallback = this.intervalTimerCallback.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.serverMessageProcessor = this.serverMessageProcessor.bind(this);
        this.createInitialDocument = this.createInitialDocument.bind(this);
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

            aceTheme: "ace/theme/monokai",
            aceMode: "ace/mode/javascript"

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

    createInitialDocument(serverDocument) {
        let document = new Document(this.state.editor.getSession().getDocument().getAllLines()); ///TODO: this should be a clean doc

        for (let i = 0; i < serverDocument.length; i++) {
            let line = (i == serverDocument.length - 1) ? serverDocument[i] : serverDocument[i] + "\n";
            document.insert({ row: i, column: 0 }, line);
        }

        this.state.editor.setSession(new EditSession(document));
        this.state.editor.session.on('change', this.handleChange);
    }

    initializeClient(message) {
        this.setState({
            clientID: message.clientID,
            HB: message.serverHB,
            serverOrdering: message.serverOrdering,
            firstSOMessageNumber: message.firstSOMessageNumber
        });
        this.createInitialDocument(message.serverDocument);
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
            msgType: com.msgTypes.GCMetadataResponse,
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
            if (message.msgType === com.msgTypes.initialize) { ///TODO: what if this is lost somehow?
                this.initializeClient(message);
            }
            else if (message.msgType === com.msgTypes.GCMetadataRequest) {
                this.sendGCMetadata();
            }
            else if (message.msgType === com.msgTypes.GC) {
                this.GC(message.GCOldestMessageNumber);
            }
        }
        // message is an operation
        else {
            setTimeout(function () {
                that.processIncomingMessage(message);
            }, that.SCLatency); // latency testing
        }
    }

    /**
     * @brief Initializes a WobSocket connection with the server.
     */
    connect = () => {
        var connection = new WebSocket(SERVER_URL); ///TODO: protocol

        ///TODO: use hooks instead of 'that'?
        let that = this;

        connection.onopen = function (e) {
            console.log("[open] Connection established");
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

    setEditorStyle(editor = null) {
        if (editor !== null) {
            editor.setTheme(this.state.aceTheme);
            editor.session.setMode(this.state.aceMode);
            editor.session.on('change', this.handleChange);
        }
        else {
            this.state.editor.setTheme(this.state.aceTheme);
            this.state.editor.session.setMode(this.state.aceMode);
            this.state.editor.session.on('change', this.handleChange);
        }
    }

    /**
     * @brief Processes incoming server messages. If it is an external operation, executes it
       using the GOT control scheme.
  
     * @note Manages serverOrdering
     * 
     * @param message Operation send by the server
     */
    processIncomingMessage(message) {
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

    // menu copyright: Copyright (c) 2021 by Jelena Jovanovic (https://codepen.io/plavookac/pen/qomrMw)
    render() {
        return (
            <div className="main">
                <div className="headerBar"></div>
                <input type="checkbox" className="openSidebarMenu" id="openSidebarMenu" />
                <label htmlFor="openSidebarMenu" className="sidebarIconToggle">
                    <div className="spinner diagonal part-1"></div>
                    <div className="spinner horizontal"></div>
                    <div className="spinner diagonal part-2"></div>
                </label>

                <div id="sidebarMenu">
                    <div className="sidebarMenuInner">
                        <Testing testingApplyLastInverse={this.testingApplyLastInverse} />
                    </div>
                </div>

                <div className="content">
                    <div id="editor" className="editor"></div>
                </div>
            </div>
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

// ========================================

ReactDOM.render(
    <Client />,
    document.getElementById('reactContainer')
);
