/* eslint-disable class-methods-use-this */
const { del, move, remline, wrapDif } = require('./subdifOps');
const { deepCopy, deepEqual, dlog } = require('./utils');
const { textToDif, UDR } = require('./dif');
const { compress } = require('./compress');
const { msgTypes } = require('./messageTypes');

class ManagedSession {
  constructor(session, clientID, commitSerialNumber, sendMessageToServer, initObj) {
    this.processOperation = this.processOperation.bind(this);
    this.processIntervalBuffer = this.processIntervalBuffer.bind(this);
    this.intervalTimerStart = this.intervalTimerStart.bind(this);
    this.intervalBufClear = this.intervalBufClear.bind(this);
    this.intervalTimerCallback = this.intervalTimerCallback.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.sendGCMetadataResponse = this.sendGCMetadataResponse.bind(this);
    this.GC = this.GC.bind(this);

    this.session = session;
    this.clientID = clientID;
    this.fileID = initObj.fileID;
    this.intervalBuf = [];
    this.measuring = false; // true for LISTEN_INTERVAL millis after the user changed the state

    // this has to be passed to the constructor, because the same document may be opened
    //      and closed several times, but the commitSerialNumber must not repeat
    this.commitSerialNumber = commitSerialNumber;

    // array of wrapped operations:
    //  [[clientID, commitSerialNumber, preceding clientID, preceding commitSerialNumber], wDif]
    this.HB = initObj.serverHB;

    // contains elements: [clientID, commitSerialNumber, prevclientID, prevCommitSerialNumber],
    //   where the information is taken from incoming operations
    this.serverOrdering = initObj.serverOrdering;

    // clientID and commitSerialNumber on which the difs in interval buffer depend on
    this.currentDependency = this.getCurrentDependency();

    // the total serial number of the first SO entry
    this.firstSOMessageNumber = initObj.firstSOMessageNumber;
    this.sendMessageToServer = sendMessageToServer;
    this.handlingChanges = true;
    this.LISTEN_INTERVAL = 500; // how long will the editor listen before sending the data to others

    this.loggingEnabled = false;
    this.DEBUG = false;

    this.session.on('change', this.handleChange);
  }

  setMode(mode) {
    this.session.setMode(mode);
  }

  getSession() {
    return this.session;
  }

  /**
     * @note This should be used to extract the commitSerialNumber before terminating this instance.
     * @returns Returns the commitSerialNumber that would be used in the next sent operation.
     */
  getNextCommitSerialNumber() {
    return this.commitSerialNumber;
  }

  setListenInterval(newInterval) {
    this.LISTEN_INTERVAL = newInterval;
  }

  getListenInterval() {
    return this.LISTEN_INTERVAL;
  }

  intervalTimerStart() {
    if (!this.measuring) {
      this.measuring = true;
      const listenInterval = this.LISTEN_INTERVAL;
      setTimeout(this.intervalTimerCallback, listenInterval, this, deepCopy(
        this.currentDependency,
      ));
    }
  }

  intervalTimerCallback(that, currentDependency) {
    // if the dependency changed, the interval buffer had to already be flushed
    if (deepEqual(that.currentDependency, currentDependency)) {
      that.measuring = false;
      that.processIntervalBuffer();
    }
  }

  intervalBufAddDif(dif) {
    this.intervalBuf = [...this.intervalBuf, ...dif];

    // in debug mode, the interval buffer needs to be flushed manually
    if (this.DEBUG) {
      return;
    }
    this.intervalTimerStart(); // starts the timer
  }

  intervalBufClear() {
    this.intervalBuf = [];
  }

  /**
     * @brief Adds the content of the interval buffer to HB and sends it to other clients.
     *   Clears the interval buffer.
     */
  processIntervalBuffer() {
    if (this.intervalBuf.length === 0) {
      return;
    }

    let dif = this.intervalBuf;
    if (!this.DEBUG) {
      dif = compress(this.intervalBuf); // organise the dif
    }
    this.intervalBufClear(); // clear the buffer for a new listening interval

    const operation = this.makeOperation(dif);

    this.sendOperationToServer(operation);
    this.pushOperationToHB(operation);
  }

  /**
     * @brief Sends an operation to the server.
     * @param {*} operation An unwrapped operation.
     */
  sendOperationToServer(operation) {
    const message = JSON.stringify(operation);
    // console.log(this.clientID, 'sending operation:', message);
    this.sendMessageToServer(message);
  }

  /**
     * @brief Wraps an unwrapped operation and pushes it to the HB.
     * @param {*} operation An unwrapped operation.
     */
  pushOperationToHB(operation) {
    const wOperation = operation;
    wOperation[1] = wrapDif(operation[1]);
    this.HB.push(wOperation);
  }

  getCurrentDependency() {
    const prevClientID = (this.serverOrdering.length === 0)
      ? -1
      : this.serverOrdering[this.serverOrdering.length - 1][0];
    const prevCommitSerialNumber = (this.serverOrdering.length === 0)
      ? -1
      : this.serverOrdering[this.serverOrdering.length - 1][1];
    return [prevClientID, prevCommitSerialNumber];
  }

  /**
     * @brief Makes an operation from a dif.
     */
  makeOperation(dif) {
    return [
      [
        this.clientID,
        this.commitSerialNumber++,
        this.currentDependency[0],
        this.currentDependency[1],
      ],
      dif,
      this.fileID,
    ];
  }

  /**
     * @returns Returns the last entry in HB.
     */
  HBGetLast() {
    return (this.HB[this.HB.length - 1]);
  }

  sendGCMetadataResponse() {
    let dependancy = -1; // value if there is no garbage ///TODO: this value should be in a lib

    if (this.serverOrdering.length > 0) {
      const lastEntry = this.serverOrdering[this.serverOrdering.length - 1];
      dependancy = this.serverOrdering.findIndex((entry) => (
        entry[0] === lastEntry[2] && entry[1] === lastEntry[3]
      ));
      dependancy += this.firstSOMessageNumber; // so that the offset is correct
    }

    // console.log(this.serverOrdering);
    const response = {
      msgType: msgTypes.client.GCMetadataResponse,
      clientID: this.clientID,
      fileID: this.fileID,
      dependancy,
    };
    this.sendMessageToServer(JSON.stringify(response));
    if (this.loggingEnabled) console.log('Sent GCMetadataResponse');
  }

  GC(message) {
    const GCOldestMessageNumber = message.GCOldestMessageNumber;
    const SOGarbageIndex = GCOldestMessageNumber - this.firstSOMessageNumber;

    if (SOGarbageIndex < 0 || SOGarbageIndex >= this.serverOrdering.length) {
      if (this.loggingEnabled) console.log('GC Bad SO index');
      return;
    }

    // find matching elements in HB to those in SO
    const HBRemovalIndices = [];
    for (let SOIndex = 0; SOIndex < SOGarbageIndex; SOIndex++) {
      const GCClientID = this.serverOrdering[SOIndex][0];
      const GCCommitSerialNumber = this.serverOrdering[SOIndex][1];
      for (let HBIndex = 0; HBIndex < this.HB.length; HBIndex++) {
        const HBClientID = this.HB[HBIndex][0][0];
        const HBCommitSerialNumber = this.HB[HBIndex][0][1];
        if (HBClientID === GCClientID && HBCommitSerialNumber === GCCommitSerialNumber) {
          HBRemovalIndices.push(HBIndex);
          break;
        }
      }
    }

    // filter out all the GC'd operations
    this.HB = this.HB.filter((operation, index) => !HBRemovalIndices.includes(index));
    this.serverOrdering = this.serverOrdering.slice(SOGarbageIndex);
    this.firstSOMessageNumber += SOGarbageIndex;
    if (this.loggingEnabled) console.log("GC'd");
  }

  /**
     * @brief Processes incoming server operations. If it is an external operation, executes it
       using the GOT control scheme.

     * @note Manages serverOrdering
     *
     * @param operation Operation send by the server
     */
  processOperation(operation, oldCursorPosition) {
    const authorID = operation[0][0];

    // own operation
    if (authorID === this.clientID) {
      this.serverOrdering.push([
        operation[0][0], operation[0][1], operation[0][2], operation[0][3],
      ]); // add own operation to SO
    }
    // GOT control algorithm
    else {
      const document = this.session.getDocument();

      /// TODO: RACE CONDITION: what about changes made by the user while
      ///   UDR is being processed with handlingChanges === false?
      this.handlingChanges = false;
      const finalState = UDR(
        operation, document, this.HB, this.serverOrdering, false, oldCursorPosition,
      );
      this.handlingChanges = true;
      /// TODO: RACE CONDITION END

      this.serverOrdering.push([
        operation[0][0], operation[0][1], operation[0][2], operation[0][3],
      ]); // append serverOrdering
      this.HB = finalState.HB;
    }

    // flush the interval buffer, because it contains changes dependent on the previous state
    this.processIntervalBuffer();
    // update the dependency for new local chnages
    this.currentDependency = this.getCurrentDependency();
  }

  handleChange(e) {
    if (!this.handlingChanges) {
      return;
    }
    // console.log(e);
    let dif = [];

    if (e.action === 'insert') {
      // single line text
      if (e.lines.length === 1) {
        dif.push([e.start.row, e.start.column, e.lines[0]]);
      }

      // newline
      else if (e.lines.length === 2 && e.lines[0] === '' && e.lines[1] === '') {
        const trailingText = this.session.getLine(e.end.row);
        dif.push(e.end.row); // add new row
        if (trailingText.length > 0) {
          dif.push(move(e.start.row, e.start.column, e.end.row, 0, trailingText.length));
        }
      }

      // paste
      else {
        const trailingText = this.session.getLine(e.start.row).substr(e.start.column);
        dif = textToDif(e.start.row, e.start.column, e.lines, trailingText);
      }
    }
    else if (e.action === 'remove') {
      // single line text removal
      if (e.lines.length === 1) {
        dif.push([e.start.row, e.start.column, e.lines[0].length]);
      }

      // remline
      else if (e.lines.length === 2 && e.lines[0] === '' && e.lines[1] === '') {
        const trailingText = this.session.getLine(e.start.row).substr(e.start.column);
        if (trailingText.length > 0) {
          dif.push(move(e.end.row, 0, e.start.row, e.start.column, trailingText.length));
        }
        dif.push(-e.end.row);
      }

      // multiline delete
      else {
        dif.push(del(e.start.row, e.start.column, e.lines[0].length));
        for (let i = 1; i < e.lines.length - 1; i++) {
          dif.push(del(e.start.row + i, 0, e.lines[i].length));
        }
        dif.push(del(e.end.row, 0, e.lines[e.lines.length - 1].length));
        const trailingText = this.session.getLine(e.start.row).substr(e.start.column);
        dif.push(move(e.end.row, 0, e.start.row, e.start.column, trailingText.length));
        for (let i = e.end.row; i > e.start.row; i--) {
          dif.push(remline(i));
        }
      }
    }
    if (this.loggingEnabled && dif.length === 0) console.log('handleChange dif is empty!');
    this.intervalBufAddDif(dif);
  }
}

module.exports = ManagedSession;
