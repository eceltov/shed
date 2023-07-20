const { add, del, newline, remline } = require('../controller/lib/subdifOps');
const lib = require('./test_lib');
const StatusChecker = require('../controller/lib/status_checker');

// TEST CONFIGURATION
cycleLengthMs = 200
cycles = 1000000
clientCount = 200;
activeClientCount = 40;
var serverURL = 'ws://localhost:8061/';

// TEST INITIALIZATION
var clients;
var clientCount;
var connectionChecker;
var msgReceivedChecker;
const testFileID = 1;
connectionChecker = new StatusChecker(clientCount);
msgReceivedChecker = new StatusChecker(clientCount);
clients = lib.createClients(clientCount, serverURL, connectionChecker, msgReceivedChecker);
// add the index of a client to see its logs
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

// TESTS SCENARIOS
const characterCount = 20;
const deletedCharacterCount = 20;

//addSingleLineTest(characterCount);
//addDifferentLinesTest(characterCount);
//addDelInterleavedTest(characterCount, deletedCharacterCount);
addDelDifferentPlacesInterleavedTest(characterCount, deletedCharacterCount);


// TEST IMPLEMENTATION
function doAddIteration(previousPromise, charCount) {
    return previousPromise
    .then(() => {
        let clientMsgCount = 1;
        let subdifCount = 1;
        for (let i = 0; i < activeClientCount * clientMsgCount; i++) {
            let dif = [];
            let index = Math.floor(i / clientMsgCount);
            for (let j = 0; j < subdifCount; j++) dif.push(add(0, j, "a".repeat(charCount)));
            clients[index].propagateLocalDif(dif);
        }
        return lib.getDelayPromise(cycleLengthMs);
    });
}

function doDelIteration(previousPromise, delCount) {
    return previousPromise
    .then(() => {
        let clientMsgCount = 1;
        let subdifCount = 1;
        for (let i = 0; i < activeClientCount * clientMsgCount; i++) {
            let dif = [];
            let index = Math.floor(i / clientMsgCount);
            for (let j = 0; j < subdifCount; j++) dif.push(del(0, 0, delCount));
            clients[index].propagateLocalDif(dif);
        }
        return lib.getDelayPromise(cycleLengthMs);
    });
}

function doDelDifferentPlacesIteration(previousPromise, delCount) {
    return previousPromise
    .then(() => {
        let clientMsgCount = 1;
        let subdifCount = 1;
        for (let i = 0; i < activeClientCount * clientMsgCount; i++) {
            let dif = [];
            let index = Math.floor(i / clientMsgCount);
            for (let j = 0; j < subdifCount; j++) dif.push(del(0, index * delCount, delCount));
            clients[index].propagateLocalDif(dif);
        }
        return lib.getDelayPromise(cycleLengthMs);
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
        return lib.getDelayPromise(cycleLengthMs);
    });
}

function doAddOnDifferentLinesIteration(previousPromise, charCount) {
    return previousPromise
    .then(() => {
        let clientMsgCount = 1;
        let subdifCount = 1;
        for (let i = 0; i < activeClientCount * clientMsgCount; i++) {
            let dif = [];
            let index = Math.floor(i / clientMsgCount);
            for (let j = 0; j < subdifCount; j++) dif.push(add(index, j, "a".repeat(charCount)));
            clients[index].propagateLocalDif(dif);
        }
        //return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
        return lib.getDelayPromise(cycleLengthMs);
    });
}

function addDelInterleavedTest(charCount, delCount) {
    let promise = lib.getStatusPromise(connectionChecker);
    for (let i = 0; i < cycles; i++) {
        if (i % 2 === 0)
            promise = doAddIteration(promise, charCount);
        else
            promise = doDelIteration(promise, delCount);
    }
    promise.then(() => {
        console.log("done");
    });
}

function addDelDifferentPlacesInterleavedTest(charCount, delCount) {
    let promise = lib.getStatusPromise(connectionChecker);
    for (let i = 0; i < cycles; i++) {
        if (i % 2 === 0)
            promise = doAddIteration(promise, charCount);
        else
            promise = doDelDifferentPlacesIteration(promise, delCount);
    }
    promise.then(() => {
        console.log("done");
    });
}


function addDifferentLinesTest(charCount) {
    let promise = lib.getStatusPromise(connectionChecker);
    for (let i = 0; i < cycles; i++) {
        if (i === 0)
            promise = doNewlineIteration(promise);
        else
            promise = doAddOnDifferentLinesIteration(promise, charCount);
    }
    promise.then(() => {
        console.log("done");
    });
}

function addSingleLineTest(charCount) {
    let promise = lib.getStatusPromise(connectionChecker);
    for (let i = 0; i < cycles; i++) {
        promise = doAddIteration(promise, charCount);
    }
    promise.then(() => {
        console.log("done");
    });
}
