var WebSocketServer = require('websocket').server;
var http = require('http');

class Server {
    constructor() {
        this.messageLog = []; ///TODO: testing only
        this.nextUserID = 0;
        this.users = [];
        this.ordering = { on: false };
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
            //console.log((new Date()) + ' Connection accepted.');
        
            let connection_metadata = {
                userID: userID
            }
        
            connection.sendUTF(JSON.stringify(connection_metadata));
            connection.on('message', function(message) {
                if (message.type === 'utf8') {
                    if (that.ordering.on) {
                        that.ordering.buffer.push(JSON.parse(message.utf8Data));
                        if (that.ordering.buffer.length === that.ordering.packages[that.ordering.currentPackage]) {
                            let userCount = -1;
                            let userMessages = [];
                            that.ordering.buffer.forEach(messageObj => userCount = (messageObj[0][0] > userCount) ? messageObj[0][0] : userCount);
                            userCount++;
                            for (let i = 0; i < userCount; i++) {
                                userMessages.push([]);
                                that.ordering.buffer.forEach(messageObj => {
                                    if (messageObj[0][0] === i) {
                                        userMessages[i].push(messageObj);
                                    }
                                });
                            }
                            let order = that.ordering.orders[that.ordering.currentPackage];
                            order.forEach(userID => {
                                let message = JSON.stringify(userMessages[userID].shift());
                                console.log('Received Message: ' + message);
                                that.sendToAllUsers(message, true);
                            });
                            that.ordering.buffer = [];
                            that.ordering.currentPackage++;
                        }                        
                    }
                    else {
                        console.log('Received Message: ' + message.utf8Data);
                        that.sendToAllUsers(message);
                    }
                }
                else {
                    console.log('Received message in non UTF-8 format');
                }
            });
            connection.on('close', function(reasonCode, description) {
                //console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
                that.removeConnection(userID); // can userID be used, or is it not in the scope?
            });
        });
    }

    addConnection(connection) {
        let userID = this.getNextUserID();
        this.users.push({
            connection: connection,
            userID: userID
        });
        return userID;
    }

    removeConnection(userID) {
        let idx = this.users.findIndex(user => user.userID === userID);
        this.users.splice(idx, 1);
    }

    getNextUserID() {
        return this.nextUserID++;
    }

    sendToUser(userID, message) {
        this.users.find(user => user.userID === userID).connection.sendUTF(message.utf8Data);
    }

    sendToAllUsers(message, stringified=false) {
        for (let user of this.users) {
            if (stringified) {
                user.connection.sendUTF(message);
            }
            else {
                user.connection.sendUTF(message.utf8Data);
            }
        }
    }

    originIsAllowed(origin) {
        // put logic here to detect whether the specified origin is allowed.
        return true;
    }

    listen(port) {
        this.server.listen(port, function() {
            //console.log((new Date()) + ' Server is listening on port ' + port);
        });
    }

    close() {
        this.wsServer.shutDown();
        this.server.close();
    }

    // example: [2, 4, 2, 1, 0, 0, 1, 1, 0] (two packages, first contains 4 messages, the second contains 2 packages)
    setOrdering(orderingFormat) {
        let orders = [];
        let offset = 1 + orderingFormat[0];
        for (let i = 0; i < orderingFormat[0]; i++) {
            let order = orderingFormat.slice(offset, offset + orderingFormat[1 + i]);
            orders.push(order);
            offset += orderingFormat[1 + i];
        }
        this.ordering.packages = orderingFormat.slice(1, 1 + orderingFormat[0]);
        this.ordering.orders = orders;
        this.ordering.currentPackage = 0;
        this.ordering.on = true;
        this.ordering.buffer = [];
    }
}

module.exports = Server;
