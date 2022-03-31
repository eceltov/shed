/* eslint-disable class-methods-use-this */
const WebSocketServer = require('websocket').server;
const http = require('http');
const WorkspaceInstance = require('./WorkspaceInstance');
const { msgTypes } = require('../lib/messageTypes');
const msgFactory = require('../lib/serverMessageFactory');
const { roles } = require('../lib/roles');
const DatabaseGateway = require('../database/DatabaseGateway');

class Server {
  constructor() {
    this.clientMessageProcessor = this.clientMessageProcessor.bind(this);
    this.initializeClient = this.initializeClient.bind(this);
    this.close = this.close.bind(this);
    // workspace management
    this.workspaces = new Map(); // maps workspace hashes to workspaces

    this.database = null;

    // attributes for client management
    this.nextclientID = 0;
    this.clients = new Map(); // maps clientIDs to an object:  { connection, workspace }
    this.loggingEnabled = false;
  }

  /**
     * @brief Initializes the websocket server.
     */
  initialize() {
    this.database = new DatabaseGateway();
    this.database.initialize();

    const that = this;
    this.server = http.createServer((request, response) => {
      if (that.loggingEnabled) {
        console.log(`${new Date()} Received request for ${request.url}`);
        console.log(request);
      }

      response.writeHead(404);
      response.end();
    });

    this.wsServer = new WebSocketServer({
      httpServer: this.server,
      autoAcceptConnections: false,
    });

    this.wsServer.on('request', that.initializeClient);

    if (this.loggingEnabled) {
      console.log('WorkspaceServer initialized.');
    }
  }

  initializeClient(request) {
    const that = this;
    /// TODO: always true
    if (!this.originIsAllowed(request.origin)) {
      // Make sure to only accept requests from an allowed origin
      request.reject();
      if (that.loggingEnabled) {
        console.log(`${new Date()} Connection from origin ${request.origin} rejected.`);
      }
      return;
    }

    const connection = request.accept('', request.origin); /// TODO: protocol
    const clientID = this.addConnection(connection);
    if (this.loggingEnabled) console.log(`${new Date()} Connection accepted.`);

    // the callback function adds the clientID to the clientMessageProcessor
    connection.on('message', (messageWrapper) => {
      const messageString = messageWrapper.utf8Data;
      const message = JSON.parse(messageString);
      that.clientMessageProcessor(message, clientID);
    });

    connection.on('close', (reasonCode, description) => {
      if (that.loggingEnabled) {
        console.log(`${new Date()} Peer ${connection.remoteAddress} disconnected.`);
      }
      that.removeConnection(clientID); // can clientID be used, or is it not in the scope?
    });
  }

  addConnection(connection) {
    const clientID = this.getNextclientID();
    const clientMetadata = {
      connection,
      workspace: null,
    };
    this.clients.set(clientID, clientMetadata);
    return clientID;
  }

  /// TODO: not implemented
  /**
     * Removes the connection from the server and all workspace and document instances.
     * @param {*} clientID The ID of the client to be removed
     */
  removeConnection(clientID) {
    const client = this.clients.get(clientID);
    if (client.workspace !== null) {
      client.workspace.removeConnection(clientID);
    }
    this.clients.delete(clientID);
    /// TODO: propagate to workspace and documents
    /// TODO: save the document if there are no clients viewing it
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
    const clientIterator = this.clients.values();
    for (let i = 0; i < this.clients.size; i++) {
      clientIterator.next().value.connection.sendUTF(messageString);
    }
  }

  /// TODO: not implemented
  /**
   * @param {*} origin The origin of a WebSocket connection.
   * @returns Returns true if the origin is from a suitable source, else returns false.
   */
  originIsAllowed(origin) {
    return true;
  }

  listen(port) {
    const that = this;
    this.server.listen(port, () => {
      if (that.loggingEnabled) console.log(`${new Date()} Server is listening on port ${port}`);
    });
  }

  /**
   * @brief Closes the WebSocket server and forces all the instantiated workspaces to be saved
   *        to the database.
   */
  close() {
    this.wsServer.shutDown();
    this.server.close();
    const workspaceIterator = this.workspaces.values();
    for (let i = 0; i < this.workspaces.size; i++) {
      workspaceIterator.next().value.closeWorkspace();
    }
  }

  enableLogging() {
    this.loggingEnabled = true;
  }

  clientMessageProcessor(message, clientID) {
    if (this.loggingEnabled) console.log(`Received Message: ${JSON.stringify(message)}`);

    // the client wants to connect to a workspace
    if (message.msgType === msgTypes.client.connect) {
      if (this.loggingEnabled) console.log('Received connect metadata');
      const userHash = this.getUserHash(message.token);
      if (userHash === null) {
        /// TODO: close the connection somehow
      }
      else {
        const role = this.database.getUserWorkspaceRole(userHash, message.workspaceHash);
        if (role !== roles.none) {
          this.connectClientToWorkspace(clientID, message.workspaceHash, role);
        }
        else {
          /// TODO: send error message
          // eslint-disable-next-line no-lonely-if
          if (this.loggingEnabled) {
            console.log('Client tried to connect with insufficient rights!');
          }
        }
      }
    }
    // the client want to use the functionality of a workspace instance
    else {
      const workspace = this.clients.get(clientID).workspace;
      workspace.clientMessageProcessor(message, clientID);
    }
  }

  /// TODO: not implemented
  /**
     * @returns Returns the hash of a user the token belongs to.
     *          Returns null if the token is invalid.
     * @param {*} token The security token provided by the authentization service.
     */
  getUserHash(token) {
    if (token === '0000') {
      return '00000000';
    }
    if (token === '0001') {
      return '00000001';
    }
    return null;
  }

  /**
     * @brief Connects a client to a workspace. Initializes the workspace if necessary.
     *
     * @note Sends an error message to the client if the workspace could not be instantiated.
     *
     * @param {*} clientID The ID of the client.
     * @param {*} workspaceHash The hash of the workspace.
     * @param {*} role The role of the client in the workspace.
     */
  connectClientToWorkspace(clientID, workspaceHash, role) {
    let workspace;

    // check if the workspace is instantiated
    if (!this.workspaces.has(workspaceHash)) {
      workspace = this.startWorkspace(workspaceHash);
      if (workspace === null) {
        // the workspace could not be instantiated
        /// TODO: send an error message
        return;
      }
    }
    else {
      workspace = this.workspaces.get(workspaceHash);
    }

    const client = this.clients.get(clientID);
    client.workspace = workspace;
    workspace.initializeClient(clientID, client.connection, role);
  }

  /// TODO: not fully implemented
  /**
     * @brief Instantiates a workspace.
     * @param {*} workspaceHash The hash of the workspace.
     * @returns Returns a reference to the workspace,
     *    or null if the workspace could not be instantiated.
     */
  startWorkspace(workspaceHash) {
    const workspace = new WorkspaceInstance();
    /// TODO: check if succeeded
    workspace.initialize(workspaceHash, this.database);
    workspace.loggingEnabled = this.loggingEnabled;
    this.workspaces.set(workspaceHash, workspace);
    return workspace;
  }
}

module.exports = Server;
