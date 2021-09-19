const LISTEN_INTERVAL = 500; // how long will the editor listen before sending the data to others
const SERVER_URL = 'ws://dev.lan:8080/';
var CSLatency = 3000;
var SCLatency = 0;
var Range = ace.require('ace/range').Range;
var EditSession = ace.require("ace/edit_session").EditSession;
var Document = ace.require("ace/document").Document;

function log(content) {
  console.log(JSON.parse(JSON.stringify(content)));
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.processIncomingMessage = this.processIncomingMessage.bind(this);
    this.propagateLocalDif = this.propagateLocalDif.bind(this);
    this.intervalTimerStart = this.intervalTimerStart.bind(this);
    this.intervalBufClear = this.intervalBufClear.bind(this);
    this.intervalTimerCallback = this.intervalTimerCallback.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.state = {
      editor: null,
      interval_buf: [],
      measuring: false, // true for half a second after the user changed the state
      connection: null,
      userID: undefined,
      commitSerialNumber: 0,

      //entry format: [[userID, commitSerialNumber, preceding userID, preceding commitSerialNumber], dif]
      HB: [],
      server_ordering: [], // contains elements: [userID, commitSerialNumber, prev_userID, prev_commitSerialNumber], where the information is taken from incoming messages
    };
  }

  intervalBufAddDif(dif) {
    this.intervalTimerStart(); // starts the timer
    this.setState((prevState) => ({
      interval_buf: [...prevState.interval_buf, ...dif],
    }));
    //logDif();
  }

  intervalBufClear() {
    this.setState((prevState) => ({
      interval_buf: [],
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

  propagateLocalDif() {
    let dif = to.merge(this.state.interval_buf); // organise the dif
    this.intervalBufClear(); // clear the buffer for a new listening interval

    this.pushLocalDifToHB(dif); // push the dif into the history buffer and add the neccesary metadata
    let message_obj = this.HBGetLast();

    let message = JSON.stringify(message_obj);
    let that = this;
    //console.log("message", message);
    setTimeout(function () {
      that.state.connection.send(message);
    }, CSLatency); // latency testing
  }

  /**
   * @brief Applies the changes the user want to make to the document state and send those changes to other users.
   */

  /**
   * @brief Pushed the dif to HB and adds the neccessary metadata.
   */
  pushLocalDifToHB(dif) {
    let prev_userID = (this.state.server_ordering.length == 0) ? -1 : this.state.server_ordering[this.state.server_ordering.length - 1][0];
    let prev_commitSerialNumber = (this.state.server_ordering.length == 0) ? -1 : this.state.server_ordering[this.state.server_ordering.length - 1][1];

    this.setState((prevState) => ({
      HB: [...prevState.HB, [
        [prevState.userID, prevState.commitSerialNumber, prev_userID, prev_commitSerialNumber], dif
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

    connection.onmessage = function (message) {
      let message_obj = JSON.parse(message.data);
      //console.log("recv message obj", message_obj);
      //console.log("recv message", message.data);

      if (that.state.userID === undefined) {
        if (message_obj.hasOwnProperty('userID')) {
          that.setState({
            userID: message_obj.userID
          });
          //console.log(that.state.userID);
        }
        else {
          ///TODO: handle lost userID data
          //console.log('userID lost!');
        }
      }
      else {
        setTimeout(function () {
          that.processIncomingMessage(message_obj);
          ///TODO: filter out own difs via a function
          ///TODO: this is setting state twice
        }, SCLatency); // latency testing
        //console.log(that.state.HB_inverse);
      }
    }
  }

  /**
   * @brief Processes incoming server messages. If it is an external operation, executes it
     using the GOT control scheme.

   * @note Manages server_ordering
   * 
   * @param message Operation send by the server
   */
  processIncomingMessage(message) {
    console.log('incoming message:');
    log(message);
    //let prev_userID = (this.state.HB.length == 0) ? -1 : this.state.HB[this.state.HB.length - 1][0][0];
    //let prev_commitSerialNumber = (this.state.HB.length == 0) ? -1 : this.state.HB[this.state.HB.length - 1][0][1];

    let authorID = message[0][0];

    // own message
    if (authorID === this.state.userID) {
      this.setState((prevState) => ({
       server_ordering: [...prevState.server_ordering, [message[0][0], message[0][1], message[0][2], message[0][3]]] // append server_ordering
      }));
    }
    // GOT control algorithm
    else {
      let final_state = to.UDR(message, this.state.editor, this.state.HB, this.state.server_ordering);
      this.state.editor.setSession(new EditSession(final_state.document)); ///TODO: it might be a good idea to buffer changes
      this.state.editor.session.on('change', this.handleChange);

      this.setState((prevState) => ({
        server_ordering: [...prevState.server_ordering, [message[0][0], message[0][1], message[0][2], message[0][3]]], // append server_ordering
        HB: final_state.HB
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
          dif.push([e.start.row, e.start.column, e.end.row, 0, trailingText.length]);
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
          dif.push([e.end.row, 0, e.start.row, e.start.column, trailingText.length]);
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
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/javascript");

    editor.session.on('change', this.handleChange);

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
            <Testing testingApplyLastInverse={this.testingApplyLastInverse}/>
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
  <App />,
  document.getElementById('reactContainer')
);
