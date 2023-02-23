const Client = require('./TestClient');
const DatabaseGateway = require('../database/DatabaseGateway');
const fsOps = require('../lib/fileStructureOps');
const { add, del, move, newline, remline } = require('../lib/subdifOps');
const { deepEqual } = require('../lib/utils');

const workspaceHash = 'testworkspace';
const database = new DatabaseGateway();
database.initialize();

const fileStructure = database.getFileStructureJSON(workspaceHash);
const pathMap = fsOps.getIDPathMap(fileStructure);

/**
 * @brief Returns a new promise linked to a StatusChecker, that will resolve after all the
 *        elements in statusChecker are checked (can happen right away),
 *        or reject if the time limit is exceeded.
 * @param statusChecker Any StatusChecker.
 * @param checkCount The amount of times each element in statusChecker needs to be checked.
 * @param timeout Time in ms after which the promise will be rejected.
 * @returns A new Promise.
 */
function getStatusPromise(statusChecker, checkCount=1, timeout=0) {
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

function getDelayPromise(delay) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, delay);
    });
}

function cleanFile(fileID) {
    database.writeDocumentData(workspaceHash, fsOps.getAbsolutePathFromIDPath(fileStructure, pathMap.get(fileID)), ['']);
}

/**
 * @brief Creates a single client.
 * @param serverURL The URL to which the client will connect.
 * @param connectionChecker A StatusChecker linked to the client's connection status.
 * @param msgReceivedChecker A StatusChecker linked to the client's message received status.
 * @returns The new client.
 */
function createClient(serverURL, connectionChecker, msgReceivedChecker) {
    let client = new Client(serverURL);
    client.onMessageReceived(msgReceivedChecker.check, 0).onConnection(connectionChecker.check, 0);
    return client;
}

/**
 * @brief Creates an array of clients.
 * @param count The amount of clients to be created.
 * @param serverURL The URL to which the clients will connect.
 * @param connectionChecker A StatusChecker linked to the clients' connection status.
 * @param msgReceivedChecker A StatusChecker linked to the clients' message received status.
 * @returns An array of clients.
 */
function createClients(count, serverURL, connectionChecker, msgReceivedChecker) {
    let clients = [];
    for (let i = 0; i < count; i++) {
        let client = new Client(serverURL);
        client.onMessageReceived(msgReceivedChecker.check, i).onConnection(connectionChecker.check, i);
        clients.push(client);
    }
    return clients;
}

/// TODO: this solution is not pretty, do not connect clients on creation etc.
function setActiveDocument(clients, fileID) {
    clients.forEach((client) => {
        client.testFileID = fileID;
    });
}

function connectClients(clients) {
    clients.forEach((client) => {
        client.connect();
    });
}

function reorderClients(clients) {
    reorderedClients = Array(clients.length);
    for (let i = 0; i < clients.length; i++) {
        reorderedClients[clients[i].clientID] = clients[i];
    }
    return reorderedClients;
}

function setOrdering(server, fileID, serverOrdering) {
    server.workspaces.get(workspaceHash).documents.get(fileID).debugSetOrdering(serverOrdering);
}

function disableDifBuffering(clients) {
    clients.forEach((client) => {
        client.disableBuffering();
    });
}

/**
 * @returns Returns true if all clients have the same document state.
 */
function sameDocumentState(clients, fileID) {
    let document = JSON.stringify(clients[0].getDocument(fileID));
    for (let i = 1; i < clients.length; i++) {
        if (document !== JSON.stringify(clients[i].getDocument(fileID))) {
            console.log("Document mismatch!");
            console.log("client 0 document:", document);
            console.log("client " + i + " document:", JSON.stringify(clients[i].getDocument(fileID)));
            return false;
        }
    }
    return true;
}

/**
 * @returns Returns true if all clients have the specified document state.
 */
function checkSameDocumentState(clients, document, fileID) {
    if (!sameDocumentState(clients, fileID)) return false;
    if (!deepEqual(clients[0].getDocument(fileID), document)) {
        console.log("Clients have the same document, but a different one than the one provided!")
        console.log("Client document:", JSON.stringify(clients[0].getDocument(fileID)));
        console.log("Provided document:", JSON.stringify(document));
        return false;
    }
    return true;
}

/**
 * @returns Returns true if all clients have the same serverOrdering.
 */
function sameServerOrdering(clients) {
    let serverOrderingString = JSON.stringify(clients[0].getServerOrdering());
    for (let i = 1; i < clients.length; i++) {
        const differentServerOrderingString = JSON.stringify(clients[i].getServerOrdering());
        if (serverOrderingString !== differentServerOrderingString) {
            console.log("serverOrdering mismatch!");
            console.log("client 0 serverOrdering:", serverOrderingString);
            console.log("client " + i + " serverOrdering:", differentServerOrderingString);
            return false;
        }
    }
    return true;
}

/**
 * @returns Returns true if all clients have the specified serverOrdering.
 */
function checkSameServerOrdering(clients, serverOrdering) {
    if (!sameServerOrdering(clients)) return false;
    if (!deepEqual(clients[0].serverOrdering, serverOrdering)) {
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
function sameHBLength(clients) {
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
function checkSameHBLength(clients, length) {
    if (!sameHBLength(clients)) return false;
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
function bijectionSOHB(client) {
    if (client.HB.length !== client.serverOrdering.length) {
        console.log("SO and HB have different lengths!");
        return false;
    }
    for (let i = 0; i < client.serverOrdering.length; i++) {
        let SOMetadata = client.serverOrdering[i];
        let match = false;
        for (let j = 0; j < client.HB.length; j++) {
            let HBMetadata = client.HB[j][0];
            if (deepEqual(SOMetadata, HBMetadata)) {
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
function checkBijectionSOHB(clients) {
    for (let i = 0; i < clients.length; i++) {
        if (!bijectionSOHB(clients[i])) {
            return false;
        }
    }
    return true;
}

function setCSGlobalLatency(clients, latency) {
    clients.forEach(client => client.CSLatency = latency);
}

function sendAdds(clientMsgCount, subdifCount, clients) {
    for (let i = 0; i < clients.length * clientMsgCount; i++) {
        let dif = [];
        for (let j = 0; j < subdifCount; j++) {
            dif.push(add(0, j, i.toString()));
        }
        let index = Math.floor(i / clientMsgCount);
        clients[index].propagateLocalDif(dif);
    }
}

function sendAddsClientID(clientMsgCount, subdifCount, clients) {
    for (let i = 0; i < clients.length; i++) {
        let clientID = clients[i].clientID;
        for (let j = 0; j < clientMsgCount; j++) {
            let dif = [];
            for (let k = 0; k < subdifCount; k++) {
                dif.push(add(0, 0, clientID.toString()));
            }
            clients[i].propagateLocalDif(dif);
        }
    }
}

function sendDels(clientMsgCount, subdifCount, clients) {
    for (let i = 0; i < clients.length * clientMsgCount; i++) {
        let dif = [];
        for (let j = 0; j < subdifCount; j++) {
            dif.push(del(0, i + j, 1));
        }
        let index = Math.floor(i / clientMsgCount);
        clients[index].propagateLocalDif(dif);
    }
}

function getAdds(minPos, maxPos, row, count) {
    let range = maxPos - minPos;
    let currentPos = minPos;
    const dif = [];
    for (let i = 0; i < count; i++) {
        dif.push(add(row, currentPos, 'abc'));
        range += 3;
        currentPos = ((currentPos - minPos + 5) % (range + 1)) + minPos; 
    }
    return dif;
}

/**
 * @brief Returns a dif simulating an Enter keypress on a specific row and position
 */
function getRowSplitDif(client, fileID, row, position) {
    const dif = [newline(row, position)];
    const document = client.getDocument(fileID);
    if (row >= document.length || position >= document[row].length) {
        console.log("getRowSplitDif incorrect parameters!");
        return dif;
    }
    return dif;
}

module.exports = {
    getStatusPromise, getDelayPromise, cleanFile, createClient, createClients, setActiveDocument,
    connectClients, reorderClients, setOrdering, disableDifBuffering, sameDocumentState,
    checkSameDocumentState, sameServerOrdering, checkSameServerOrdering, sameHBLength,
    checkSameHBLength, bijectionSOHB, checkBijectionSOHB, setCSGlobalLatency, sendAdds,
    sendAddsClientID, sendDels, getRowSplitDif, getAdds,
};
