const { add, del, newline, remline } = require('../controller/lib/subdifOps');
const lib = require('./test_lib');
const StatusChecker = require('../controller/lib/status_checker');

var serverURL = 'ws://localhost:8061/';
var clients;
var clientCount;
var connectionChecker;
var msgReceivedChecker;

/*const server = new Server();
server.initialize();
//server.enableLogging();
server.listen(8080);*/

clientCount = 200;
activeClientCount = 50;
const testFileID = 1;
connectionChecker = new StatusChecker(clientCount);
msgReceivedChecker = new StatusChecker(clientCount);
clients = lib.createClients(clientCount, serverURL, connectionChecker, msgReceivedChecker);
const loggingClients = [];
clients.forEach((client, index) => {
    if (loggingClients.includes(index)) {
        client.loggingEnabled = true;
    }
});

lib.setActiveDocument(clients, testFileID);
lib.connectClients(clients);
lib.disableDifBuffering(clients);


lib.cleanFile(testFileID);

function doAddIteration(previousPromise) {
    return previousPromise
    .then(() => {
        let clientMsgCount = 1;
        let subdifCount = 1;
        let charCount = 1;
        for (let i = 0; i < activeClientCount * clientMsgCount; i++) {
            let dif = [];
            let index = Math.floor(i / clientMsgCount);
            for (let j = 0; j < subdifCount; j++) dif.push(add(0, j, "a".repeat(charCount)));
            clients[index].propagateLocalDif(dif);
        }
        //return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
        return lib.getDelayPromise(200);
    });
}

function doDelIteration(previousPromise) {
    return previousPromise
    .then(() => {
        let clientMsgCount = 1;
        let subdifCount = 1;
        for (let i = 0; i < activeClientCount * clientMsgCount; i++) {
            let dif = [];
            let index = Math.floor(i / clientMsgCount);
            for (let j = 0; j < subdifCount; j++) dif.push(del(0, index, 1));
            clients[index].propagateLocalDif(dif);
        }
        //return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
        return lib.getDelayPromise(200);
    });
}

function doNewlineIteration(previousPromise) {
    return previousPromise
    .then(() => {
        let clientMsgCount = 1;
        let subdifCount = 1;
        for (let i = 0; i < activeClientCount * clientMsgCount; i++) {
            let dif = [];
            let index = Math.floor(i / clientMsgCount);
            for (let j = 0; j < subdifCount; j++) dif.push(newline(0, 0));
            clients[index].propagateLocalDif(dif);
        }
        //return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
        return lib.getDelayPromise(200);
    });
}

function doAddOnDifferentLinesIteration(previousPromise) {
    return previousPromise
    .then(() => {
        let clientMsgCount = 1;
        let subdifCount = 1;
        let charCount = 1;
        for (let i = 0; i < activeClientCount * clientMsgCount; i++) {
            let dif = [];
            let index = Math.floor(i / clientMsgCount);
            for (let j = 0; j < subdifCount; j++) dif.push(add(index, j, "a".repeat(charCount)));
            clients[index].propagateLocalDif(dif);
        }
        //return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
        return lib.getDelayPromise(200);
    });
}

function addDelInterleasedTest() {
    const iterationCount = 10000;

    let promise = lib.getStatusPromise(connectionChecker);
    for (let i = 0; i < iterationCount; i++) {
        if (i % 2 === 0)
            promise = doAddIteration(promise);
        else
            promise = doDelIteration(promise);
    }
    promise.then(() => {
        console.log("done");
    });
}

function addDifferentLinesTest() {
    const iterationCount = 10000;

    let promise = lib.getStatusPromise(connectionChecker);
    for (let i = 0; i < iterationCount; i++) {
        if (i === 0)
            promise = doNewlineIteration(promise);
        else
            promise = doAddOnDifferentLinesIteration(promise);
    }
    promise.then(() => {
        console.log("done");
    });
}

function addSingleLineTest() {
    const iterationCount = 10000;

    let promise = lib.getStatusPromise(connectionChecker);
    for (let i = 0; i < iterationCount; i++) {
        promise = doAddIteration(promise);
    }
    promise.then(() => {
        console.log("done");
    });
}

//addDifferentLinesTest();
addDelInterleasedTest();

/*
lib.getStatusPromise(connectionChecker)
.then(() => {
    let clientMsgCount = 1;
    let subdifCount = 1;
    let charCount = 10;
    for (let i = 0; i < clientCount * clientMsgCount; i++) {
        let dif = [];
        let index = Math.floor(i / clientMsgCount);
        for (let j = 0; j < subdifCount; j++) dif.push(add(0, j, "a".repeat(charCount)));
        clients[index].propagateLocalDif(dif);
    }
    //return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    return lib.getDelayPromise(200);
})
.then(() => {
    let clientMsgCount = 1;
    let subdifCount = 1;
    for (let i = 0; i < clientCount * clientMsgCount; i++) {
        let dif = [];
        let index = Math.floor(i / clientMsgCount);
        for (let j = 0; j < subdifCount; j++) dif.push(add(0, j, index.toString()));
        clients[index].propagateLocalDif(dif);
    }
    //return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    return lib.getDelayPromise(1000);
})
.then(() => {
    //lib.cleanFile(testFileID);
});
*/
