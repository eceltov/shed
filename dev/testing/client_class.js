var to = require('../lib/dif');
var com = require('../lib/communication');
var WebSocketClient = require('websocket').client;

class Client {
    constructor(serverURL) {
      this.serverMessageProcessor = this.serverMessageProcessor.bind(this);
      this.processIncomingMessage = this.processIncomingMessage.bind(this);

      this.connection = null;
      this.WSClient = null;
      this.userID = null;
      this.commitSerialNumber = 0;
      this.HB = [];
      this.document = [""];
      this.serverOrdering = [];
      this.firstSOMessageNumber = 0; // the total serial number of the first SO entry
      this.serverURL = null;
      this.SCLatency = 0;
      this.CSLatency = 0;
      this.serverURL = serverURL;
      this.onMessageCallback = null;
      this.onMessageCallbackArgument = null;
      this.log = false;
    }

    sendMessageToServer(messageString) {
      let that = this;
      setTimeout(function () {
        that.connection.sendUTF(messageString);
      }, that.CSLatency); // latency testing
    }

    propagateLocalDif(dif) {
        this.applyDif(dif);
        this.pushLocalDifToHB(dif);
        let message = to.prim.deepCopy(this.HBGetLast());
        message[1] = to.prim.unwrapDif(message[1]);

        let messageString = JSON.stringify(message);
        this.sendMessageToServer(messageString);
      }
  
    /**
     * @brief Pushed the dif to HB and adds the neccessary metadata.
     */
    pushLocalDifToHB(dif) {
      let prevUserID = (this.serverOrdering.length == 0) ? -1 : this.serverOrdering[this.serverOrdering.length - 1][0];
      let prevCommitSerialNumber = (this.serverOrdering.length == 0) ? -1 : this.serverOrdering[this.serverOrdering.length - 1][1];

      let wDif = to.prim.wrapDif(dif);

      this.HB.push([
        [this.userID, this.commitSerialNumber, prevUserID, prevCommitSerialNumber], wDif
      ]);
      this.commitSerialNumber++;

    }
  
    /**
     * @returns Returns the last entry in HB.
     */
    HBGetLast() {
      return (this.HB[this.HB.length - 1]);
    }

    serverMessageProcessor(message) {
      //console.log(this.userID, "received message: ", JSON.stringify(message));
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
          // for debug purposes only, used for status checkers
          if (that.onMessageCallback !== null) {
            that.onMessageCallback(that.onMessageCallbackArgument);
          } 
          that.processIncomingMessage(message);
        }, that.SCLatency); // latency testing
      }
    }

    initializeClient(message) {
      this.userID = message.userID;
      this.document = message.serverDocument;
      this.HB = message.serverHB;
      this.serverOrdering = message.serverOrdering;
    }

    sendGCMetadata() {
      let dependancy = -1; // value if there is no garbage

      if (this.serverOrdering.length > 0) {
        let lastEntry = this.serverOrdering[this.serverOrdering.length - 1];
        dependancy =  this.serverOrdering.findIndex(entry => entry[0] === lastEntry[2] && entry[1] === lastEntry[3]);
        if (dependancy === -1 && lastEntry[2] !== -1) console.log("------- Something horrible happened -------"); // the dependancy is missing!
        dependancy += this.firstSOMessageNumber; // so that the offset is correct
      }

      //console.log(this.serverOrdering);
      let message = {
        msgType: com.msgTypes.GCMetadataResponse,
        userID: this.userID,
        dependancy: dependancy
      };
      let messageString = JSON.stringify(message);
      this.sendMessageToServer(messageString);
    }

    GC(GCOldestMessageNumber) {
      let SOGarbageIndex = GCOldestMessageNumber - this.firstSOMessageNumber;

      if (GCOldestMessageNumber < 0) {
        console.log("Nothing to be GC'd.");
        return;
      }

      if (SOGarbageIndex >= this.serverOrdering.length) {
        console.log("GC Bad SO index");
        return;
      }

      let GCUserID = this.serverOrdering[SOGarbageIndex][0];
      let GCCommitSerialNumber = this.serverOrdering[SOGarbageIndex][1];

      let HBGarbageIndex = 0;

      for (let i = 0; i < this.HB.length; i++) {
        let HBUserID = this.HB[i][0][0];
        let HBCommitSerialNumber = this.HB[i][0][1];
        if (HBUserID === GCUserID && HBCommitSerialNumber === GCCommitSerialNumber) {
          HBGarbageIndex = i;
          break;
        }
      }

      this.HB = this.HB.slice(HBGarbageIndex);
      this.serverOrdering = this.serverOrdering.slice(SOGarbageIndex);
      this.firstSOMessageNumber += SOGarbageIndex;
      //console.log("Free", SOGarbageIndex);
    }
  
    /**
     * @brief Initializes a WobSocket connection with the server.
     */
    connect() {
      this.WSClient = new WebSocketClient();
  
      ///TODO: use hooks instead of 'that'?
      let that = this;

      this.WSClient.on('connect', function(connection) {
        //console.log("[open] Connection established");
        that.connection = connection;
        if (that.onConnectionCallback !== null) {
          that.onConnectionCallback(that.onConnectionCallbackArgument);
        } 

        connection.on('message', function (messageWrapper) {
          //console.log('received message', message);
          let message = JSON.parse(messageWrapper.utf8Data);
          that.serverMessageProcessor(message);
        });
      });

      this.WSClient.connect(this.serverURL);
    }

    /**
     * @brief Processes incoming server messages. If it is an external operation, executes it
       using the GOT control scheme.
  
     * @note Manages serverOrdering
     * 
     * @param message Operation send by the server
     */
    processIncomingMessage(message) {
      //console.log('incoming message:', message);
  
      let authorID = message[0][0];
  
      // own message
      if (authorID === this.userID) {
        this.serverOrdering.push([message[0][0], message[0][1], message[0][2], message[0][3]]); // append serverOrdering
      }
      // GOT control algorithm
      else {
        let finalState = to.UDRTest(message, this.document, this.HB, this.serverOrdering, this.log);
        this.serverOrdering.push([message[0][0], message[0][1], message[0][2], message[0][3]]); // append serverOrdering
        this.HB = finalState.HB;
        this.document = finalState.document;
      }
    }

    applyDif(dif) {
      dif.forEach((subdif) => {
        if (to.isAdd(subdif)) {
          let row = this.document[subdif[0]];
          this.document[subdif[0]] = row.substr(0, subdif[1]) + subdif[2] + row.substr(subdif[1]);
        }
        else if (to.isDel(subdif)) {
          let row = this.document[subdif[0]];
          this.document[subdif[0]] = row.substr(0, subdif[1]) + row.substr(subdif[1] + subdif[2]);
        }
        else if (to.isMove(subdif)) {
          let sourceRow = this.document[subdif[0]];
          let targetRow = this.document[subdif[2]];
          let movedText = sourceRow.substr(subdif[1], subdif[4]);
          this.document[subdif[0]] = sourceRow.substr(0, subdif[1]) + sourceRow.substr(subdif[1] + subdif[4]);
          this.document[subdif[2]] = targetRow.substr(0, subdif[3]) + movedText + targetRow.substr(subdif[3]);
        }
        else if (to.isNewline(subdif)) {
          this.document.splice(subdif, 0, "");
        }
        else if (to.isRemline(subdif)) {
          this.document.splice(-subdif, 1);
        }
        else {
            console.log("Received unknown subdif!", subdif);
        }
      });
    }

    onMessageReceived(callback, argument) {
      this.onMessageCallback = callback;
      this.onMessageCallbackArgument = argument;
      return this;
    }

    onConnection(callback, argument) {
      this.onConnectionCallback = callback;
      this.onConnectionCallbackArgument = argument;
      return this;
    }
  }

  module.exports = Client;
  