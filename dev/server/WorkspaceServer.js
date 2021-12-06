const WebSocketServer = require('websocket').server;
const http = require('http');
const StatusChecker = require('../lib/status_checker');
const WorkspaceInstance = require('./WorkspaceInstance');
const to = require('../lib/dif');
const com = require('../lib/communication');
const fs = require('fs');


class Server {
    constructor() {
        this.clientMessageProcessor = this.clientMessageProcessor.bind(this);
        this.debugHandleMessage = this.debugHandleMessage.bind(this);
        this.processMessage = this.processMessage.bind(this);
        this.GC = this.GC.bind(this);
        this.initializeClient = this.initializeClient.bind(this);

        // workspace management
        this.workspaces = new Map();

        // attributes for user management
        this.nextclientID = 0;
        this.users = new Map(); // maps clientIDs to connections
    }

    /**
     * @brief Initializes the websocket server.
     */
    initialize() {
        this.server = http.createServer(function(request, response) {
            console.log((new Date()) + ' Received request for ' + request.url);
            console.log(request);
            response.writeHead(404);
            response.end();
        });
        
        this.wsServer = new WebSocketServer({
            httpServer: this.server,
            autoAcceptConnections: false
        });

        let that = this;
        this.wsServer.on('request', that.initializeClient);
    }

    initializeClient(request) {
        ///TODO: always true
        if (!this.originIsAllowed(request.origin)) {
            // Make sure to only accept requests from an allowed origin
            request.reject();
            console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
            return;
          }
          
          let connection = request.accept('', request.origin); ///TODO: protocol
          let clientID = this.addConnection(connection);
          if (this.log) console.log((new Date()) + ' Connection accepted.');
      
          let that = this;
          connection.on('message', that.clientMessageProcessor);
          connection.on('close', function(reasonCode, description) {
              //console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
              that.removeConnection(clientID); // can clientID be used, or is it not in the scope?
          });
    }

    addConnection(connection) {
        let clientID = this.getNextclientID();
        this.users.set(clientID, connection);
        return clientID;
    }

    removeConnection(clientID) {
        this.users.delete(clientID);
        // write to file if all users left
        if (this.users.size == 0) {
            this.updateDocumentFile();
        }
    }

    closeConnection(clientID) {
        this.users.get(clientID).close();
    }

    getNextclientID() {
        return this.nextclientID++;
    }

    sendMessageToClient(clientID, messageString) {
        this.users.get(clientID).sendUTF(messageString);
    }

    sendMessageToClients(messageString) {
        let userIterator = this.users.values();
        for (let i = 0; i < this.users.size; i++) {
            userIterator.next().value.sendUTF(messageString);
        }
    }

    originIsAllowed(origin) {
        // put logic here to detect whether the specified origin is allowed.
        return true;
    }

    listen(port) {
        let that = this;
        this.server.listen(port, function() {
            if (that.log) console.log((new Date()) + ' Server is listening on port ' + port);
        });
    }

    close() {
        this.wsServer.shutDown();
        this.server.close();
        this.updateDocumentFile();
    }

    enableLogging() {
        this.log = true;
    }

    clientMessageProcessor(messageWrapper) {
        let messageString = messageWrapper.utf8Data;
        let message = JSON.parse(messageString);

        if (message.hasOwnProperty('msgType')) {
            if (this.log) console.log('Received Message: ' + messageString);

            if (message.msgType === com.clientMsg.connect) {
                const userHash = this.getUserHash(message.credentials, message.token);
                if (userHash === null) {
                    ///TODO: close the connection somehow
                }
                else {
                    if (this.checkUserWorkspacePermission(userHash, message.workspaceHash)) {
                        let clientID = 0; ///TODO: get clientID
                        this.connectClientToWorkspace(clientID, message.workspaceHash);
                    }
                    else {
                        ///TODO: send error message
                    }
                }
            }
        }
    }

    ///TODO: not implemented
    /**
     * @returns Returns the hash of the user, if the user is has valid credentials and token.
     *          Else returns null.
     * @param {*} credentials The credentials of the user.
     * @param {*} token The security token provided by the authentization service.
     */
    getUserHash(credentials, token) {
        return "00000000";
    }

    ///TODO: not implemented
    /**
     * @returns True if the user can access the workspace, else false.
     * @param {*} userHash The hash of the user.
     * @param {*} workspaceHash The hash of the workspace.
     */
    checkUserWorkspacePermission(userHash, workspaceHash) {
        return true;
    }

    /**
     * @brief Connects a user to a workspace. Initializes the workspace if necessary.
     * 
     * @note Sends an error message to the user if the workspace could not be instantiated.
     * 
     * @param {*} clientID The ID of the user.
     * @param {*} workspaceHash The hash of the workspace.
     */
    connectClientToWorkspace(clientID, workspaceHash) {
        // check if the workspace is instantiated
        if (this.workspaces.get(workspaceHash) === undefined) {
            if(!this.startWorkspace()) {
                // the workspace could not be instantiated
                ///TODO: send an error message
            }
        }
        else {
            this.workspaces.get(workspaceHash).initializeClient(this.users.get(clientID));
        }
    }

    ///TODO: not fully implemented
    /**
     * @brief Instantiates a workspace.
     * @param {*} workspaceHash The hash of the workspace.
     * @returns Returns true if the workspace was initialized successfully. Else returns false.
     */
    startWorkspace(workspaceHash) {
        let workspace = new WorkspaceInstance();
        workspace.initialize(workspaceHash);
        this.workspaces.set(workspaceHash, workspace);
        ///TODO: check if succeeded
        return true;
    }
}

module.exports = Server;
