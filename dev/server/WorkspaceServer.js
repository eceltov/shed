const WebSocketServer = require('websocket').server;
const http = require('http');
const StatusChecker = require('../lib/status_checker');
const WorkspaceInstance = require('./WorkspaceInstance');
const to = require('../lib/dif');
const com = require('../lib/communication');
const DatabaseGateway = require('../database/DatabaseGateway');
const fs = require('fs');


class Server {
    constructor() {
        this.clientMessageProcessor = this.clientMessageProcessor.bind(this);
        this.initializeClient = this.initializeClient.bind(this);
        // workspace management
        this.workspaces = new Map(); // maps workspace hashes to workspaces

        this.database = null;

        // attributes for user management
        this.nextclientID = 0;
        this.clients = new Map(); // maps clientIDs to an object:  { connection, workspace }
    }

    /**
     * @brief Initializes the websocket server.
     */
    initialize() {
        this.database = new DatabaseGateway();
        this.database.initialize();

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

        console.log("WorkspaceServer initialized.");
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

          // the callback function adds the clientID to the clientMessageProcessor
          connection.on('message', (messageWrapper) => {
            const messageString = messageWrapper.utf8Data;
            const message = JSON.parse(messageString);
            that.clientMessageProcessor(message, clientID);
          });

          connection.on('close', function(reasonCode, description) {
              console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
              that.removeConnection(clientID); // can clientID be used, or is it not in the scope?
          });
    }

    addConnection(connection) {
        let clientID = this.getNextclientID();
        const userMetadata = {
            connection: connection,
            workspace: null
        };
        this.clients.set(clientID, userMetadata);
        return clientID;
    }

    ///TODO: not implemented
    /**
     * Removes the connection from the server and all workspace and document instances.
     * @param {*} clientID The ID of the client to be removed
     */
    removeConnection(clientID) {
        const client = this.clients.get(clientID);
        client.workspace.removeConnection(clientID);
        this.clients.delete(clientID);
        ///TODO: propagate to workspace and documents
        ///TODO: save the document if there are no users viewing it
    }

    closeConnection(clientID) {
        this.clients.get(clientID).connection.close();
    }

    getNextclientID() {
        return this.nextclientID++;
    }

    sendMessageToClient(clientID, messageString) {
        this.clients.get(clientID).connection.sendUTF(messageString);
    }

    sendMessageToClients(messageString) {
        let userIterator = this.clients.values();
        for (let i = 0; i < this.clients.size; i++) {
            userIterator.next().value.connection.sendUTF(messageString);
        }
    }

    ///TODO: not implemented
    /**
     * @param {*} origin The origin of a WebSocket connection.
     * @returns Returns true if the origin is from a suitable source, else returns false.
     */
    originIsAllowed(origin) {
        return true;
    }

    listen(port) {
        let that = this;
        this.server.listen(port, function() {
            if (that.log) console.log((new Date()) + ' Server is listening on port ' + port);
        });
    }

    ///TODO: not implemented
    /**
     * @brief Closes the WebSocket server and forces all the instantiated workspaces to be saved
     *        to the database.
     */
    close() {
        this.wsServer.shutDown();
        this.server.close();
        ///TODO: save workspaces
    }

    enableLogging() {
        this.log = true;
    }

    clientMessageProcessor(message, clientID) {
        if (this.log) console.log('Received Message: ' + JSON.stringify(message));

        // the client wants to connect to a workspace
        if (message.msgType === com.clientMsg.connect) {
            console.log("Received connect metadata");
            const userHash = this.getUserHash(message.credentials, message.token);
            if (userHash === null) {
                ///TODO: close the connection somehow
            }
            else {
                if (this.checkUserWorkspacePermission(userHash, message.workspaceHash)) {
                    this.connectClientToWorkspace(clientID, message.workspaceHash);
                }
                else {
                    ///TODO: send error message
                }
            }
        }
        // the client want to use the functionality of a workspace instance
        else {
            const workspace = this.clients.get(clientID).workspace;
            workspace.clientMessageProcessor(message, clientID);
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
        let workspace;

        // check if the workspace is instantiated
        if (!this.workspaces.has(workspaceHash)) {
            workspace = this.startWorkspace(workspaceHash);
            if(workspace === null) {
                // the workspace could not be instantiated
                ///TODO: send an error message
                return;
            }
        }
        else {
            workspace = this.workspaces.get(workspaceHash);
        }

        const client = this.clients.get(clientID);
        client.workspace = workspace;
        workspace.initializeClient(clientID, client.connection);
    }

    ///TODO: not fully implemented
    /**
     * @brief Instantiates a workspace.
     * @param {*} workspaceHash The hash of the workspace.
     * @returns Returns a reference to the workspace, or null if the workspace could not be instantiated.
     */
    startWorkspace(workspaceHash) {
        let workspace = new WorkspaceInstance();
        ///TODO: check if succeeded
        workspace.initialize(workspaceHash, this.database);
        this.workspaces.set(workspaceHash, workspace);
        return workspace;
    }
}

module.exports = Server;
