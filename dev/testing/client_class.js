var to = require('../lib/dif');
var WebSocketClient = require('websocket').client;

class Client {
    constructor(serverURL) {
      this.connection = null;
      this.userID = null;
      this.commitSerialNumber = 0;
      this.HB = [];
      this.document = [""];
      this.server_ordering = [];
      this.serverURL = null;
      this.SCLatency = 0;
      this.CSLatency = 0;
      this.serverURL = serverURL;
      this.onMessageCallback = null;
      this.onMessageCallbackArgument = null;
      this.log = false;
    }

    propagateLocalDif(dif) {
        this.applyDif(dif);
        this.pushLocalDifToHB(dif);
        let message_obj = to.prim.deepCopy(this.HBGetLast());
        message_obj[1] = to.prim.unwrapDif(message_obj[1]);

        let message = JSON.stringify(message_obj);
        let that = this;
        setTimeout(function () {
          that.connection.sendUTF(message);
        }, that.CSLatency); // latency testing
      }
  
    /**
     * @brief Pushed the dif to HB and adds the neccessary metadata.
     */
    pushLocalDifToHB(dif) {
      let prev_userID = (this.server_ordering.length == 0) ? -1 : this.server_ordering[this.server_ordering.length - 1][0];
      let prev_commitSerialNumber = (this.server_ordering.length == 0) ? -1 : this.server_ordering[this.server_ordering.length - 1][1];

      let wDif = to.prim.wrapDif(dif);

      this.HB.push([
        [this.userID, this.commitSerialNumber, prev_userID, prev_commitSerialNumber], wDif
      ]);
      this.commitSerialNumber++;

    }
  
    /**
     * @returns Returns the last entry in HB.
     */
    HBGetLast() {
      return (this.HB[this.HB.length - 1]);
    }
  
    /**
     * @brief Initializes a WobSocket connection with the server.
     */
    connect() {
      let client = new WebSocketClient();
  
      ///TODO: use hooks instead of 'that'?
      let that = this;

      client.on('connect', function(connection) {
        //console.log("[open] Connection established");
        that.connection = connection;
        if (that.onConnectionCallback !== null) {
          that.onConnectionCallback(that.onConnectionCallbackArgument);
        } 

        connection.on('message', function (message) {
          //console.log('received message', message);
          let message_obj = JSON.parse(message.utf8Data);
    
          if (that.userID === null) {
            if (message_obj.hasOwnProperty('userID')) {
              that.userID = message_obj.userID;
            }
            else {
              ///TODO: handle lost userID data
              //console.log('userID lost!');
            }
          }
          else {
            setTimeout(function () {
              if (that.onMessageCallback !== null) {
                that.onMessageCallback(that.onMessageCallbackArgument);
              } 
              that.processIncomingMessage(message_obj);
            }, that.SCLatency); // latency testing
          }
        });
      });

      client.connect(this.serverURL);
    }
  
    /**
     * @brief Processes incoming server messages. If it is an external operation, executes it
       using the GOT control scheme.
  
     * @note Manages server_ordering
     * 
     * @param message Operation send by the server
     */
    processIncomingMessage(message) {
      //console.log('incoming message:', message);
  
      let authorID = message[0][0];
  
      // own message
      if (authorID === this.userID) {
        this.server_ordering.push([message[0][0], message[0][1], message[0][2], message[0][3]]); // append server_ordering
      }
      // GOT control algorithm
      else {
        let final_state = to.UDRTest(message, this.document, this.HB, this.server_ordering, this.log);
        this.server_ordering.push([message[0][0], message[0][1], message[0][2], message[0][3]]); // append server_ordering
        this.HB = final_state.HB;
        this.document = final_state.document;
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
  