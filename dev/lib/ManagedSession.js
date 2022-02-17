class ManagedSession {
    constructor(session, clientID, fileID, commitSerialNumber, HB, serverOrdering, firstSOMessageNumber, sendMessageToServer) {
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
        this.fileID = fileID;
        this.intervalBuf = [];
        this.measuring = false; // true for LISTEN_INTERVAL millis after the user changed the state
        this.commitSerialNumber = commitSerialNumber; // this has to be passed to the constructor, because the same document may be opened and closed several times, but the commitSerialNumber must not repeat
        this.HB = HB; // array of wrapped operations: [[clientID, commitSerialNumber, preceding clientID, preceding commitSerialNumber], wDif]
        this.serverOrdering = serverOrdering; // contains elements: [clientID, commitSerialNumber, prevclientID, prevCommitSerialNumber], where the information is taken from incoming operations
        this.firstSOMessageNumber = firstSOMessageNumber; // the total serial number of the first SO entry
        this.sendMessageToServer = sendMessageToServer;
        this.handlingChanges = true;
        this.LISTEN_INTERVAL = 500; // how long will the editor listen before sending the data to others

        this.session.on('change', this.handleChange);
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

    getListenInterval() {
        return this.LISTEN_INTERVAL;
    }

    intervalTimerStart() {
        if (!this.measuring) {
            this.measuring = true;
            const listenInterval = this.LISTEN_INTERVAL;
            setTimeout(this.intervalTimerCallback, listenInterval, this);
        }
    }

    intervalTimerCallback(that) {
        that.measuring = false;
        that.processIntervalBuffer();
    }

    intervalBufAddDif(dif) {
        this.intervalTimerStart(); // starts the timer
        this.intervalBuf = [...this.intervalBuf, ...dif];
    }

    intervalBufClear() {
        this.intervalBuf = [];
    }

    /**
     * @brief Adds the content of the interval buffer to HB and sends it to other clients. Clears the interval buffer.
     */
    processIntervalBuffer() {
        const dif = to.compress(this.intervalBuf); // organise the dif
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
        this.sendMessageToServer(message);
    }

    /**
     * @brief Wraps an unwrapped operation and pushes it to the HB.
     * @param {*} operation An unwrapped operation.
     */
    pushOperationToHB(operation) {
        const wOperation = operation;
        wOperation[1] = to.prim.wrapDif(operation[1]);
        this.HB.push(wOperation);
    }

    /**
     * @brief Makes an operation from a dif.
     */
    makeOperation(dif) {
        const prevClientID = (this.serverOrdering.length == 0) ? -1 : this.serverOrdering[this.serverOrdering.length - 1][0];
        const prevCommitSerialNumber = (this.serverOrdering.length == 0) ? -1 : this.serverOrdering[this.serverOrdering.length - 1][1];
        return [[this.clientID, this.commitSerialNumber++, prevClientID, prevCommitSerialNumber], dif, this.fileID];
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
            dependancy = this.serverOrdering.findIndex(entry => entry[0] === lastEntry[2] && entry[1] === lastEntry[3]);
            dependancy += this.firstSOMessageNumber; // so that the offset is correct
        }

        //console.log(this.serverOrdering);
        const response = {
            msgType: msgTypes.client.GCMetadataResponse,
            clientID: this.clientID,
            fileID: this.fileID,
            dependancy: dependancy
        };
        this.sendMessageToServer(JSON.stringify(response));
        console.log("Sent GCMetadataResponse");
    }

    GC(message) {
        const GCOldestMessageNumber = message.GCOldestMessageNumber;
        const SOGarbageIndex = GCOldestMessageNumber - this.firstSOMessageNumber;

        if (SOGarbageIndex < 0 || SOGarbageIndex >= this.serverOrdering.length) {
            console.log("GC Bad SO index");
            return;
        }

        const GCClientID = this.serverOrdering[SOGarbageIndex][0];
        const GCCommitSerialNumber = this.serverOrdering[SOGarbageIndex][1];

        let HBGarbageIndex = 0;

        for (let i = 0; i < this.HB.length; i++) {
            const HBClientID = this.HB[i][0][0];
            const HBCommitSerialNumber = this.HB[i][0][1];
            if (HBClientID === GCClientID && HBCommitSerialNumber === GCCommitSerialNumber) {
                HBGarbageIndex = i;
                break;
            }
        }

        this.HB = this.HB.slice(HBGarbageIndex);
        this.serverOrdering = this.serverOrdering.slice(SOGarbageIndex);
        this.firstSOMessageNumber += SOGarbageIndex;
        console.log("GC'd");
    }

    /**
     * @brief Processes incoming server operations. If it is an external operation, executes it
       using the GOT control scheme.
  
     * @note Manages serverOrdering
     * 
     * @param operation Operation send by the server
     */
    processOperation(operation, oldCursorPosition) {
        console.log('incoming operation:');
        log(operation);

        const authorID = operation[0][0];

        // own operation
        if (authorID === this.clientID) {
            this.serverOrdering.push([operation[0][0], operation[0][1], operation[0][2], operation[0][3]]); // add own operation to SO
        }
        // GOT control algorithm
        else {
            const document = this.session.getDocument();

            ///TODO: RACE CONDITION: what about changes made by the user while UDR is being processed with handlingChanges === false?
            this.handlingChanges = false;
            const finalState = to.UDR(operation, document, this.HB, this.serverOrdering, false, oldCursorPosition);
            this.handlingChanges = true;
            ///TODO: RACE CONDITION END


            this.serverOrdering.push([operation[0][0], operation[0][1], operation[0][2], operation[0][3]]); // append serverOrdering
            this.HB = finalState.HB;
        }
    }

    handleChange(e) {
        if (!this.handlingChanges) {
            return;
        }
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
                let trailingText = this.session.getLine(e.end.row);
                dif.push(e.end.row); // add new row
                if (trailingText.length > 0) {
                    dif.push(to.move(e.start.row, e.start.column, e.end.row, 0, trailingText.length));
                }
            }

            // paste
            else {
                let trailingText = this.session.getLine(e.start.row).substr(e.start.column);
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
                let trailingText = this.session.getLine(e.start.row).substr(e.start.column);
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
                let trailingText = this.session.getLine(e.start.row).substr(e.start.column);
                dif.push(to.move(e.end.row, 0, e.start.row, e.start.column, trailingText.length));
                for (let i = e.end.row; i > e.start.row; i--) {
                    dif.push(to.remline(i));
                }
            }
        }
        if (dif.length === 0) console.log("handleChange dif is empty!");
        this.intervalBufAddDif(dif);
    }
}
