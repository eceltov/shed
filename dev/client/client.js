///TODO: slowly adding newlines vs. rapidly adding newlines produces different results (in dif content, this might not be an issue)
///TODO: what to do when an external dif arrives during the interval of local user changes? (the DS before and after the external dif application is different, how to timestamp this dif?)
/// possible solution is to delay all external dif applications until the interval ends

const LISTEN_INTERVAL = 500; // how long will the editor listen before sending the data to others
const SERVER_URL = 'ws://dev.lan:8080/';

var CSLatency = 0;
var SCLatency = 0;

class Row extends React.Component {
  constructor(props) {
    super(props);

    // This binding is necessary to make `this` work in the callback
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handlePaste = this.handlePaste.bind(this);
  }

  handleKeyPress(e) {
    let cursor_row = this.props.index;
    let cursor_position = e.target.selectionEnd;
    this.props.cursorSetPosition(cursor_row, cursor_position);

    if (e.key === "Enter") {
      e.preventDefault();
      let thisRowContent = this.props.getRow(this.props.index).content;
      let dif = [];
      dif.push(this.props.index + 1); // add new row
      if (thisRowContent.length - cursor_position !== 0) {
        dif.push([this.props.index, thisRowContent.length, thisRowContent.length - cursor_position]); // delete trailing text on this row
        dif.push([this.props.index + 1, 0, thisRowContent.substr(cursor_position)]); // add trailing text to next row
      }
      this.props.cursorSetPosition(cursor_row + 1, 0);
      this.props.processLocalDif(dif);
    }

    else if (e.key === "ArrowUp" && this.props.index > 0) {
      e.preventDefault();
      let following_row_length = this.props.getRow(cursor_row - 1).content.length;
      this.props.cursorSetPosition(--cursor_row, Math.min(cursor_position, following_row_length));
      this.props.cursorFocus(cursor_row, cursor_position);
    }

    else if (e.key === "ArrowDown" && this.props.index < this.props.getRowCount() - 1) {
      e.preventDefault();
      let preceding_row_length = this.props.getRow(cursor_row + 1).content.length;
      this.props.cursorSetPosition(++cursor_row, Math.min(cursor_position, preceding_row_length));
      this.props.cursorFocus(cursor_row, cursor_position);
    }

    else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (cursor_position > 0) {
        this.props.cursorSetPosition(cursor_row, --cursor_position);
      }
      else if (cursor_row > 0) {
        cursor_position = this.props.getRow(--cursor_row).content.length;
        this.props.cursorSetPosition(cursor_row, cursor_position);
      }
      this.props.cursorFocus(cursor_row, cursor_position);
    }

    else if (e.key === "ArrowRight") {
      e.preventDefault();
      let row_length = this.props.getRow(cursor_row).content.length;
      if (cursor_position < row_length) {
        this.props.cursorSetPosition(cursor_row, ++cursor_position);
      }
      else if (cursor_row < this.props.getRowCount() - 1) {
        cursor_position = 0;
        this.props.cursorSetPosition(++cursor_row, cursor_position);
      }
      this.props.cursorFocus(cursor_row, cursor_position);
    }

    ///TODO: DELETE
    ///TODO: TAB

    else if (e.key === "Backspace") {
      e.preventDefault();
      if (cursor_position === 0 && this.props.index > 0) {

        let prevRowContent = this.props.getRow(this.props.index - 1).content;
        let thisRowContent = this.props.getRow(this.props.index).content;
        let dif = [];
        dif.push([this.props.index - 1, prevRowContent.length, thisRowContent]); // add content to prev row
        dif.push([this.props.index, thisRowContent.length, thisRowContent.length]); // remove content from this row
        dif.push(-this.props.index); // remove this row

        this.props.processLocalDif(dif);
      }

      if (cursor_position !== 0) {
        this.props.processLocalDif([
          [this.props.index, cursor_position, 1]
        ]);
      }
    }

    ///TODO: this is not a pretty solution
    ///TODO: does not work as intended if ctrl, alt, shift... is pressed
    else if (e.key.length == 1 && e.altKey === false && e.ctrlKey === false) {
      e.preventDefault();
      // increase the cursor position by one and add the letter to the previous position
      this.props.cursorSetPosition(cursor_row, cursor_position + 1);
      this.props.processLocalDif([
        [this.props.index, cursor_position, e.key]
      ]);
    }
  }

  /**
   * @returns Returns an object containing information on what row and 
     position the cursor should be after pasting.
   */
  pastedTextEndPos(row, position, text) {
    const LINE_EXPRESSION = /\r\n|\n\r|\n|\r/g;
    let lines = text.split(LINE_EXPRESSION);

    return {
      row: row + lines.length - 1,
      position: position + lines[lines.length - 1].length
    }
  }

  handlePaste(e) {
    console.log("paste event");
    e.stopPropagation();
    e.preventDefault();
    let cursor = this.props.cursorGetPosition();
    let clipboardData, pastedData;

    // Get pasted data via clipboard API
    clipboardData = e.clipboardData || window.clipboardData;
    pastedData = clipboardData.getData('Text');

    const selection = window.getSelection();

    if (!selection.rangeCount) return false;
    selection.deleteFromDocument();

    let trailingText = this.props.getRow(this.props.index).content.substr(cursor.position);
    let dif = to.textToDif(this.props.index, cursor.position, pastedData, trailingText);

    let endPos = this.pastedTextEndPos(cursor.row, cursor.position, pastedData);
    this.props.cursorSetPosition(endPos.row, endPos.position);
    this.props.processLocalDif(dif);
  }

  componentDidMount() {
    ///TODO: the function should do somehing only once
    let cursor = this.props.cursorGetPosition();

    if (this.props.index === cursor.row) {
      this.props.cursorFocus();
    }
  }


  render() {
    return (
      <div className="input-group">
        <div className="input-group-prepend">
          <span className="input-group-text" id="basic-addon1"> {this.props.index} </span>
        </div>

        <input 
          id={this.props.index}
          defaultValue={this.props.getRow(this.props.index).content}
          onKeyDown={this.handleKeyPress}
          onPaste={this.handlePaste}
          className="form-control"
        />
      </div>
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.applyDif = this.applyDif.bind(this);
    this.processLocalDif = this.processLocalDif.bind(this);
    this.getRowCount = this.getRowCount.bind(this);
    this.getRowRange = this.getRowRange.bind(this);
    this.getRow = this.getRow.bind(this);
    this.processDif = this.processDif.bind(this);
    this.intervalTimerStart = this.intervalTimerStart.bind(this);
    this.intervalBufClear = this.intervalBufClear.bind(this);
    this.intervalTimerCallback = this.intervalTimerCallback.bind(this);
    this.cursorSetPosition = this.cursorSetPosition.bind(this);
    this.cursorGetPosition = this.cursorGetPosition.bind(this);
    this.cursorFocus = this.cursorFocus.bind(this);
    this.testingApplyLastInverse = this.testingApplyLastInverse.bind(this);
    this.state = {
      topRowIndex: 0,
      rowCount: 1,
      maxRowsOnScreen: 2000, ///TODO: temporary until scrolling is implemented
      nextRowID: 1,
      rows: [{
        content: "",
        ID: 0,
      }, ],
      interval_buf: [],
      interval_inverse_buf: [],
      measuring: false, // true for half a second after the user changed the state
      cursor: {
        row: 0,
        position: 0,
      },
      connection: null,
      userID: undefined,
      commitSerialNumber: 0,

      //entry format: [[userID, commitSerialNumber, preceding userID, preceding commitSerialNumber], dif]
      HB: [],
      HB_inverse: []
    };
  }

  ///TODO: Cursor: implement get/set methods for nextRowID, rowCount...

  renderRow(element, index) {
    return(
      <Row key={element.ID.toString()}
         index={index} 
         getRowCount={this.getRowCount} 
         getRow={this.getRow}
         rowCount={this.rowCount}
         intervalTimerStart={this.intervalTimerStart}
         processLocalDif={this.processLocalDif}
         cursorSetPosition={this.cursorSetPosition}
         cursorGetPosition={this.cursorGetPosition}
         cursorFocus={this.cursorFocus}
      />
    );
  }

  wheelDirectionUP(e) {
    if (e.wheelDelta) {
      return e.wheelDelta > 0;
    }
    return e.deltaY < 0;
  }

  /**
   * @brief Overrides user scrolling and instead shows a different set of rows
   * 
   * @notes This might have to get optimalized, as fast scrolling triggers a lot of rerenders. 
   */
  handleWheel(e) {
    console.log("Wheel");
    //e.preventDefault();
    //e.stopPropagation();

    if (this.state.rowCount > this.state.topRowIndex + this.state.maxRowsOnScreen) {
      if (this.wheelDirectionUP(e)) {
        this.setState((prevState) => ({
          topRowIndex: this.state.topRowIndex - 1
        }));
      }
      else {
        this.setState((prevState) => ({
          topRowIndex: this.state.topRowIndex + 1
        }));
      }
    }
  }

  cursorFocus(row = this.state.cursor.row, position = this.state.cursor.position) {
    ///TODO: this might be unneccessary
    if (row < this.state.topRowIndex || row > this.state.topRowIndex + this.state.maxRowsOnScreen) {
      return;
    }

    ///TODO: should row 0 be the default one?
    var e = document.getElementById(row) || document.getElementById(0);
    e.focus();
    e.setSelectionRange(position, position);
  }

  cursorSetPosition(row, position) {
    this.setState((prevState) => ({
      cursor: {
        row: row,
        position: position
      }
    }));
  }

  cursorGetPosition() {
    return {
      row: this.state.cursor.row,
      position: this.state.cursor.position
    };
  }

  intervalBufAddDif(dif, inverse_dif) {
    this.intervalTimerStart(); // starts the timer
    this.setState((prevState) => ({
      interval_buf: [...prevState.interval_buf, ...dif],
      interval_inverse_buf: [...prevState.interval_inverse_buf, ...inverse_dif]
    }));
    //logDif();
  }

  intervalBufClear() {
    this.setState((prevState) => ({
      interval_buf: [],
      interval_inverse_buf: []
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
    that.processDif();
  }

  processDif() {
    let dif = to.merge(this.state.interval_buf); // organise the dif
    let inverse_dif = this.state.interval_inverse_buf;
    inverse_dif.reverse();
    inverse_dif = to.merge(inverse_dif);
    //console.log(inverse_dif);
    ///TODO: process inverse_dif

    this.intervalBufClear(); // intervalBufClear the buffer for new user changes

    this.pushLocalDifToHB(dif, inverse_dif); // push the dif into the history buffer and add the neccesary metadata
    var message = JSON.stringify(this.HBGetLast());
    let that = this;

    setTimeout(function () {
      that.state.connection.send(message);
    }, CSLatency); // latency testing
  }

  handleClick(e) {
    //console.log("click");
    //e.preventDefault();
  }

  getRowCount() {
    return this.state.rowCount;
  }

  getRowRange(start, end) {
    return this.state.rows.slice(start, end);
  }

  getRow(row_idx) {
    return this.state.rows[row_idx];
  }

  /**
   * @brief Applies the changes the user want to make to the document state and send those changes to other users.
   */
  processLocalDif(dif) {
    let inverse_dif = this.applyDif(dif); // applies the dif to the local document state and gets the inverse dif
    this.intervalBufAddDif(dif, inverse_dif); // propagates the dif to other users
    this.cursorFocus(); // moves the cursor of the correct position, based on the user's action
  }

  applyDif(dif) {
    let nextRowIDIncrement = 0;
    let rowCountIncrement = 0;
    let new_rows = [...this.state.rows];
    let inverse_dif = [];
    //console.log("dif", dif);

    // apply newlines
    for (var i = 0; i < dif.length && to.isNewline(dif[i]); ++i) {
      new_rows.splice(dif[i], 0, {
        content: "",
        ID: this.state.nextRowID + nextRowIDIncrement++,
      });
      rowCountIncrement++;

      // creating inverse subdif
      let rowContent = new_rows[dif[i]].content;
      inverse_dif.push(-dif[i]); // remove the row
      inverse_dif.push([dif[i], rowContent.length, rowContent.length]); // remove content from the row
      inverse_dif.push([dif[i] - 1, rowContent.length, rowContent]); // add content to prev row
    }

    // apply adds and dels
    for (i; i < dif.length && !to.isRemline(dif[i]); ++i) {
      let row_idx = dif[i][0];

      //creating inverse subdif to deletion
      if (to.isDel(dif[i])) {
        let position = dif[i][1] - dif[i][2];
        let content = new_rows[row_idx].content.substr(position, dif[i][2]);
        inverse_dif.push([row_idx, position, content]);
      }

      let prev_content = new_rows[row_idx].content;
      new_rows[row_idx].content = to.applySubdif(prev_content, dif[i]);
      new_rows[row_idx].ID = this.state.nextRowID + nextRowIDIncrement++;

      // creating inverse subdif to addition
      if (to.isAdd(dif[i])) {
        inverse_dif.push([dif[i][0], dif[i][1] + dif[i][2].length, dif[i][2].length]);
      }
    }

    // apply remlines
    for (i; i < dif.length; ++i) {
      let row_idx = -dif[i];
      new_rows.splice(row_idx, 1);
      rowCountIncrement--;

      // creating inverse subdif
      inverse_dif.push(-dif[i]);
    }

    this.setState((prevState) => ({
      rows: new_rows,
      nextRowID: prevState.nextRowID + nextRowIDIncrement,
      rowCount: prevState.rowCount + rowCountIncrement
    }));

    return inverse_dif;
  }

  /**
   * @brief Pushed the dif to HB and adds the neccessary metadata.
   */
  pushLocalDifToHB(dif, inverse_dif) {
    let prev_userID = (this.state.HB.length == 0) ? -1 : this.state.HB[this.state.HB.length - 1][0][0];
    let prev_commitSerialNumber = (this.state.HB.length == 0) ? -1 : this.state.HB[this.state.HB.length - 1][0][1];

    this.setState((prevState) => ({
      HB: [...prevState.HB, [
        [prevState.userID, prevState.commitSerialNumber, prev_userID, prev_commitSerialNumber], dif
      ]],
      HB_inverse: [...prevState.HB_inverse, [
        [prevState.userID, prevState.commitSerialNumber, prev_userID, prev_commitSerialNumber], inverse_dif
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
          let new_HB = [...that.state.HB];
          new_HB.push(message_obj);

          if (message_obj[0][0] !== that.state.userID) {
            let inverse_dif = that.applyDif(message_obj[1]);
            inverse_dif.reverse();
            inverse_dif = to.merge(inverse_dif);
            that.setState((prevState) => ({
              HB: new_HB,
              HB_inverse: [...prevState.HB_inverse, [
                [...message_obj[0]], inverse_dif
              ]]
            }));
          }
          else {
            that.setState((prevState) => ({
              HB: new_HB,
            }));
          }
          ///TODO: filter out own difs via a function
          ///TODO: this is setting state twice
        }, SCLatency); // latency testing
        //console.log(that.state.HB_inverse);
      }
    }
  }

  testingApplyLastInverse() {
    let HB_inverse = [...this.state.HB_inverse];
    if (HB_inverse.length === 0) {
      return;
    }
    /*for (let i = HB_inverse.length - 1; i > 0; --i) {
      this.applyDif(HB_inverse[i][1]);
    }*/
    this.applyDif(HB_inverse[HB_inverse.length - 1][1]);
    HB_inverse.splice(HB_inverse.length - 1, 1);

    this.setState((prevState) => ({
      HB_inverse: HB_inverse
    }));
  }

  componentDidMount() {
    this.connect();
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

        <div id='center' className="content">
          <div className="textArea">
            <div
              onWheel={this.handleWheel}
              onClick={this.handleClick}>
              {this.getRowRange(this.state.topRowIndex, this.state.topRowIndex + this.state.maxRowsOnScreen)
                .map((element, index) => this.renderRow(element, index)
              )}
            </div>
          </div>
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
   * @note CS latency is implemented in the App.processDif function
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
          <input className="text-right w-25" type="number" id="client-server" name="client-server" min="0" step="100" defaultValue="0" onChange={this.CSHandleChange}></input>
        </div>

        <div className="my-3">
          <label className="mx-2" htmlFor="server-client">server -&gt; client latency (ms):</label>
          <input className="text-right w-25" type="number" id="server-client" name="server-client" min="0" step="100" defaultValue="0" onChange={this.SCHandleChange}></input>
        </div>

        <div className="my-3">
          <button type="button" className="btn btn-light" name="reverse" onClick={this.props.testingApplyLastInverse}>reverse</button>
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
