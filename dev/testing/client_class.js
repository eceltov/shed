var to = require('../lib/dif');
var WebSocketClient = require('websocket').client;

class Client {
    constructor(serverURL) {
      this.connection = null;
      this.userID = null;
      this.commitSerialNumber = 0;
      this.HB = [];
      this.server_ordering = [];
      this.serverURL = null;
      this.SCLatency = 0;
      this.CSLatency = 0;
      this.serverURL = serverURL;
      this.onMessageCallback = null;
      this.onMessageCallbackArgument = null;
    }

    propagateLocalDif(dif) {
        this.pushLocalDifToHB(dif);
        let message_obj = this.HBGetLast();
    
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

      this.HB.push([
        [this.userID, this.commitSerialNumber, prev_userID, prev_commitSerialNumber], dif
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
        let final_state = to.UDR_no_editor(message, this.HB, this.server_ordering);
        this.server_ordering.push([message[0][0], message[0][1], message[0][2], message[0][3]]); // append server_ordering
        this.HB = final_state.HB;
      }
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
  