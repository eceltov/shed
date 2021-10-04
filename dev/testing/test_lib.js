var Client = require('./client_class');
var to = require('../lib/dif');


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

/**
 * @returns Returns true if all clients have the same document state.
 */
test.sameDocumentState = function(clients) {
    let document = JSON.stringify(clients[0].document);
    for (let i = 1; i < clients.length; i++) {
        if (document !== JSON.stringify(clients[i].document)) {
            return false;
        }
    }
    return true;
}

test.checkSameDocumentState = function(clients, document) {
    if (!test.sameDocumentState(clients)) return false;
    return to.prim.deepEqual(clients[0].document, document);
}

test.setCSGlobalLatency = function(clients, latency) {
    clients.forEach(client => client.CSLatency = latency);
}

test.sendAdds = function(clientMsgCount, clients) {
    for (let i = 0; i < clients.length * clientMsgCount; i++) {
        let dif = [to.add(0, 0, i.toString()), to.add(0, 1, i.toString())];
        let index = Math.floor(i / clientMsgCount);
        clients[index].propagateLocalDif(dif);
    }
}

test.sendDels = function(clientMsgCount, clients) {
    for (let i = 0; i < clients.length * clientMsgCount; i++) {
        let dif = [to.del(0, i, 1), to.del(0, i + 1, 1)];
        let index = Math.floor(i / clientMsgCount);
        clients[index].propagateLocalDif(dif);
    }
}

module.exports = test;