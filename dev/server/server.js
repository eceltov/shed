var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    console.log(request);
    response.writeHead(404);
    response.end();
});
server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}


var user_com = {
    nextUserID: 0,
    users: [],
    addConnection: function(connection) {
        let userID = this.getNextUserID();
        this.users.push({
            connection: connection,
            userID: userID
        });
        return userID;
    },
    removeConnection: function(userID) {
        let idx = this.users.findIndex(user => user.userID === userID);
        this.users.splice(idx, 1);
    },
    getNextUserID: function() {
        return this.nextUserID++;
    },
    sendToUser: function(userID, message) {
        this.users.find(user => user.userID === userID).connection.sendUTF(message.utf8Data);
    },
    sendToAllUsers: function(message) {
        for (let user of this.users) {
            user.connection.sendUTF(message.utf8Data);
        }
    }
};


wsServer.on('request', function(request) {
    ///TODO: always true
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    var connection = request.accept('', request.origin); ///TODO: protocol
    let userID = user_com.addConnection(connection);
    console.log((new Date()) + ' Connection accepted.');

    let connection_metadata = {
        userID: userID
    }

    connection.sendUTF(JSON.stringify(connection_metadata));
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            //console.log('Received Message: ' + message.utf8Data);
            user_com.sendToAllUsers(message);
        }
        else {
            console.log('Received message in non UTF-8 format');
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        user_com.removeConnection(userID); // can userID be used, or is it not in the scope?
    });
});