var Client = require('./client_class');
var to = require('../lib/dif');
const { client } = require('websocket');


var test = {};

/**
 * @brief Returns a new promise linked to a StatusChecker, that will resolve after all the
 *        elements in statusChecker are checked (can happen right away),
 *        or reject if the time limit is exceeded.
 * @param statusChecker Any StatusChecker.
 * @param checkCount The amount of times each element in statusChecker needs to be checked.
 * @param timeout Time in ms after which the promise will be rejected.
 * @returns A new Promise.
 */
 test.getStatusPromise = function(statusChecker, checkCount=1, timeout=0) {
    return new Promise((resolve, reject) => {
        statusChecker.setCheckCount(checkCount);
        if (statusChecker.ready()) {
            statusChecker.reset();
            resolve();
        } 
        statusChecker.setReadyCallback(resolve);
        if (timeout > 0) {
            setTimeout(reject, timeout);
        }
    });
}

test.getDelayPromise = function(delay) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, delay);
    });
}

/**
 * @brief Creates a single client, that will automatically attempt connect.
 * @param serverURL The URL to which the client will connect.
 * @param connectionChecker A StatusChecker linked to the client's connection status.
 * @param msgReceivedChecker A StatusChecker linked to the client's message received status.
 * @returns The new client.
 */
test.createClient = function(serverURL, connectionChecker, msgReceivedChecker) {
    let client = new Client(serverURL);
    client.onMessageReceived(msgReceivedChecker.check, 0).onConnection(connectionChecker.check, 0).connect();
    return client;
}

/**
 * @brief Creates an array of clients, that will automatically attempt connect.
 * @param count The amount of clients to be created.
 * @param serverURL The URL to which the clients will connect.
 * @param connectionChecker A StatusChecker linked to the clients' connection status.
 * @param msgReceivedChecker A StatusChecker linked to the clients' message received status.
 * @returns An array of clients.
 */
test.createClients = function(count, serverURL, connectionChecker, msgReceivedChecker) {
    let clients = [];
    for (i = 0; i < count; i++) {
        let client = new Client(serverURL);
        client.onMessageReceived(msgReceivedChecker.check, i).onConnection(connectionChecker.check, i).connect();
        clients.push(client);
    }
    return clients;
}

test.reorderClients = function(clients) {
    reorderedClients = Array(clients.length);
    for (let i = 0; i < clients.length; i++) {
        reorderedClients[clients[i].clientID] = clients[i];
    }
    return reorderedClients;
}

/**
 * @returns Returns true if all clients have the same document state.
 */
test.sameDocumentState = function(clients) {
    let document = JSON.stringify(clients[0].document);
    for (let i = 1; i < clients.length; i++) {
        if (document !== JSON.stringify(clients[i].document)) {
            console.log("Document mismatch!");
            console.log("client 0 document:", document);
            console.log("client " + i + " document:", JSON.stringify(clients[i].document));
            return false;
        }
    }
    return true;
}

/**
 * @returns Returns true if all clients have the specified document state.
 */
test.checkSameDocumentState = function(clients, document) {
    if (!test.sameDocumentState(clients)) return false;
    if (!to.prim.deepEqual(clients[0].document, document)) {
        console.log("Clients have the same document, but a different one than the one provided!")
        console.log("Client document:", JSON.stringify(clients[0].document));
        console.log("Provided document:", JSON.stringify(document));
        return false;
    }
    return true;
}

/**
 * @returns Returns true if all clients have the same serverOrdering.
 */
test.sameServerOrdering = function(clients) {
    let serverOrderingString = JSON.stringify(clients[0].serverOrdering);
    for (let i = 1; i < clients.length; i++) {
        if (serverOrderingString !== JSON.stringify(clients[i].serverOrdering)) {
            console.log("serverOrdering mismatch!");
            console.log("client 0 serverOrdering:", serverOrderingString);
            console.log("client " + i + " serverOrdering:", JSON.stringify(clients[i].serverOrdering));
            return false;
        }
    }
    return true;
}

/**
 * @returns Returns true if all clients have the specified serverOrdering.
 */
test.checkSameServerOrdering = function(clients, serverOrdering) {
    if (!test.sameServerOrdering(clients)) return false;
    if (!to.prim.deepEqual(clients[0].serverOrdering, serverOrdering)) {
        console.log("Clients have the same serverOrdering, but a different one than the one provided!")
        console.log("Client serverOrdering:", JSON.stringify(clients[0].serverOrdering));
        console.log("Provided serverOrdering:", JSON.stringify(serverOrdering));
        return false;
    }
    return true;
}

/**
 * @returns Returns true if all clients have the same HB length.
 */
 test.sameHBLength = function(clients) {
    let HBLength = clients[0].HB.length;
    for (let i = 1; i < clients.length; i++) {
        if (HBLength !== clients[i].HB.length) {
            console.log("HB length mismatch!");
            console.log("client 0 HB length:", HBLength);
            console.log("client " + i + " HB length:", clients[i].HB.length);
            return false;
        }
    }
    return true;
}

/**
 * @returns Returns true if all clients have the specified HB length.
 */
test.checkSameHBLength = function(clients, length) {
    if (!test.sameHBLength(clients)) return false;
    if (clients[0].HB.length !== length) {
        console.log("Clients have the same HB length, but a different one than the one provided!")
        console.log("Client HB length:", clients[0].HB.length);
        console.log("Provided HB length:", length);
        return false;
    }
    return true;
}

/**
 * @returns Returns true if there is a bijection between SO and HB entries. 
 */
test.bijectionSOHB = function(client) {
    if (client.HB.length !== client.serverOrdering.length) {
        console.log("SO and HB have different lengths!");
        return false;
    }
    for (let i = 0; i < client.serverOrdering.length; i++) {
        let SOMetadata = client.serverOrdering[i];
        let match = false;
        for (let j = 0; j < client.HB.length; j++) {
            let HBMetadata = client.HB[j][0];
            if (to.prim.deepEqual(SOMetadata, HBMetadata)) {
                match = true;
                break;
            }
        }
        if (!match) {
            console.log("No match found in HB!");
            return false;
        }
    }
    return true;
}

/**
 * @returns Returns true if there is a bijection between SO and HB entries for all clients. 
 */
test.checkBijectionSOHB = function(clients) {
    for (let i = 0; i < clients.length; i++) {
        if (!test.bijectionSOHB(clients[i])) {
            return false;
        }
    }
    return true;
}




test.setCSGlobalLatency = function(clients, latency) {
    clients.forEach(client => client.CSLatency = latency);
}

test.sendAdds = function(clientMsgCount, subdifCount, clients) {
    for (let i = 0; i < clients.length * clientMsgCount; i++) {
        let dif = [];
        for (let j = 0; j < subdifCount; j++) {
            dif.push(to.add(0, j, i.toString()));
        }
        let index = Math.floor(i / clientMsgCount);
        clients[index].propagateLocalDif(dif);
    }
}

test.sendAddsClientID = function(clientMsgCount, subdifCount, clients) {
    for (let i = 0; i < clients.length; i++) {
        let clientID = clients[i].clientID;
        for (let j = 0; j < clientMsgCount; j++) {
            let dif = [];
            for (let k = 0; k < subdifCount; k++) {
                dif.push(to.add(0, 0, clientID.toString()));
            }
            clients[i].propagateLocalDif(dif);
        }
    }
}

test.sendDels = function(clientMsgCount, subdifCount, clients) {
    for (let i = 0; i < clients.length * clientMsgCount; i++) {
        let dif = [];
        for (let j = 0; j < subdifCount; j++) {
            dif.push(to.del(0, i + j, 1));
        }
        let index = Math.floor(i / clientMsgCount);
        clients[index].propagateLocalDif(dif);
    }
}

/**
 * @brief Returns a dif simulating an Enter keypress on a specific row and position
 */
test.getRowSplitDif = function(client, row, position) {
    let dif = [];
    if (row >= client.document.length || position >= client.document[row].length) {
        console.log("getRowSplitDif incorrect parameters!");
        return dif;
    }
    dif.push(row + 1);
    if (position > 0) {
        let trailingRowText = client.document[row].substr(position);
        dif.push(to.move(row, position, row + 1, 0, trailingRowText.length));
    }
    return dif;
}

module.exports = test;