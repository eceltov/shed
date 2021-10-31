var WebSocketServer = require('websocket').server;
var http = require('http');
var to = require('../lib/dif');
var fs = require('fs');


class Server {
    constructor() {
        this.handleMessage = this.handleMessage.bind(this);
        this.debugHandleMessage = this.debugHandleMessage.bind(this);
        this.processMessage = this.processMessage.bind(this);

        // attributes for document maintenance
        this.HB = [];
        this.serverOrdering = [];
        this.document = null;
        this.documentPath = null; // the document path will always be provided by the Controller

        // attributes for user management
        this.nextUserID = 0;
        this.users = [];

        // attribute for garbage collection
        this.garbageCount = 0; // current amount of messages since last GC
        this.garbageMessageMax = 100; // after how many messages to GC

        // attributes for testing
        this.messageLog = [];
        this.ordering = { on: false };
        this.log = false;
    }

    /**
     * @brief Initializes the websocket server and initial document state.
     * @param documentPath The path to a file storing the initial state.
     */
    initialize(documentPath=null) {
        this.document = this.getInitialDocument(documentPath);
        this.documentPath = documentPath;

        this.server = http.createServer(function(request, response) {
            console.log((new Date()) + ' Received request for ' + request.url);
            console.log(request);
            response.writeHead(404);
            response.end();
        });
        
        this.wsServer = new WebSocketServer({
            httpServer: this.server,
            // You should not use autoAcceptConnections for production
            // applications, as it defeats all standard cross-origin protection
            // facilities built into the protocol and the browser.  You should
            // *always* verify the connection's origin and decide whether or not
            // to accept it.
            autoAcceptConnections: false
        });

        let that = this;
        this.wsServer.on('request', function(request) {
            ///TODO: always true
            if (!that.originIsAllowed(request.origin)) {
              // Make sure we only accept requests from an allowed origin
              request.reject();
              console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
              return;
            }
            
            let connection = request.accept('', request.origin); ///TODO: protocol
            let userID = that.addConnection(connection);
            if (that.log) console.log((new Date()) + ' Connection accepted.');
        
            let userInitData = that.createUserInitData(userID);
        
            connection.sendUTF(JSON.stringify(userInitData));
            connection.on('message', that.handleMessage);
            connection.on('close', function(reasonCode, description) {
                //console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
                that.removeConnection(userID); // can userID be used, or is it not in the scope?
            });
        });
    }

    // the Controller will create the initial document for the server, this is not implemented yet however
    getInitialDocument(documentPath) {
        let document;
        if (documentPath === null) {
            document = [ "" ];
        }
        else if (this.validateDocumentPath(documentPath)) {
            try {
                const data = fs.readFileSync(documentPath, 'utf8')
                document = data.split(/\r?\n/);
            }
            catch (err) {
                console.error(err)
                document = [ "" ];
            }
        }
        else {
            console.log("Invalid document path.");
            document = [ "" ];
        }
        return document;
    }

    validateDocumentPath(documentPath) {
        return true;
    }

    /**
     * @brief Writes the content of the local document to the output document path.
     */
    updateDocumentFile() {
        if (this.documentPath === null) {
            return;
        }

        let documentCopy = JSON.parse(JSON.stringify(this.document)); // deep copy
        // erase file content and write first line
        fs.writeFile(this.documentPath, documentCopy[0], function(err) {
            if (err) {
                console.error(err);
            }
        });
        // append the rest of lines
        for (let i = 1; i < documentCopy.length; i++) {
            fs.appendFile(this.documentPath, '\n' + documentCopy[i], function(err) {
                if (err) {
                    console.error(err);
                }
            });
        }
    }

    GC() {
        this.garbageCount++;
        if (this.garbageCount >= this.garbageMessageMax) {
            ///TODO: implement GC
            this.garbageCount = 0;
            this.updateDocumentFile();
        }
    }

    addConnection(connection) {
        let userID = this.getNextUserID();
        this.users.push({
            connection: connection,
            userID: userID
        });
        return userID;
    }

    createUserInitData(userID) {
        return {
            userID: userID,
            serverDocument: this.document,
            serverHB: this.HB
        }
    }

    removeConnection(userID) {
        let idx = this.users.findIndex(user => user.userID === userID);
        this.users.splice(idx, 1);
        // write to file if all users left
        if (this.users.length == 0) {
            this.updateDocumentFile();
        }
    }

    getNextUserID() {
        return this.nextUserID++;
    }

    sendToUser(userID, message) {
        this.users.find(user => user.userID === userID).connection.sendUTF(message.utf8Data);
    }

    sendToAllUsers(message) {
        for (let user of this.users) {
            user.connection.sendUTF(message.utf8Data);
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

    // example: [[1, 0], [0, 1, 1, 0]] (two packages, first contains 2 messages, the second contains 4 messages)
    setOrdering(orders) {
        this.ordering.orders = orders;
        this.ordering.currentPackage = 0;
        this.ordering.on = true;
        this.ordering.buffer = [];
    }

    enableLogging() {
        this.log = true;
    }

    handleMessage(message) {
        if (message.type === 'utf8') {
            if (this.ordering.on) {
                this.debugHandleMessage(message);
            }
            else {
                this.processMessage(message);
                this.GC();
            }
        }
        else {
            if(that.log) console.log('Received message in non UTF-8 format');
        }
    }

    processMessage(messageWrapper) {
        if(this.log) console.log('Received Message: ' + messageWrapper.utf8Data);
        this.sendToAllUsers(messageWrapper);

        let message = JSON.parse(messageWrapper.utf8Data);
        let resultingState = to.UDRTest(message, this.document, this.HB, this.serverOrdering);
        this.serverOrdering.push([message[0][0], message[0][1], message[0][2], message[0][3]]); // append serverOrdering
        this.HB = resultingState.HB;
        this.document = resultingState.document;
    }

    debugHandleMessage(message) {
        this.ordering.buffer.push(JSON.parse(message.utf8Data));
        if (this.ordering.buffer.length === this.ordering.orders[this.ordering.currentPackage].length) {
            let userCount = -1;
            let userMessages = [];
            this.ordering.buffer.forEach(messageObj => userCount = (messageObj[0][0] > userCount) ? messageObj[0][0] : userCount);
            userCount++;
            for (let i = 0; i < userCount; i++) {
                userMessages.push([]);
                this.ordering.buffer.forEach(messageObj => {
                    if (messageObj[0][0] === i) {
                        userMessages[i].push(messageObj);
                    }
                });
            }
            let order = this.ordering.orders[this.ordering.currentPackage];
            order.forEach(userID => {
                let message = JSON.stringify(userMessages[userID].shift());
                this.processMessage({ utf8Data: message });
            });
            this.ordering.buffer = [];
            this.ordering.currentPackage++;
        }                        
    }
}

module.exports = Server;
