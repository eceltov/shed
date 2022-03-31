const { add } = require('../lib/subdifOps');
const lib = require('./test_lib');
const StatusChecker = require('../lib/status_checker');
const Server = require('../server/WorkspaceServer');

var serverURL = 'ws://localhost:8080/';
var clients;
var clientCount;
var connectionChecker;
var msgReceivedChecker;

const server = new Server();
server.initialize();
//server.enableLogging();
server.listen(8080);

clientCount = 5;
const testFileID = 1;
connectionChecker = new StatusChecker(clientCount);
msgReceivedChecker = new StatusChecker(clientCount);
clients = lib.createClients(clientCount, serverURL, connectionChecker, msgReceivedChecker);
clients.forEach((client) => {
    client.loggingEnabled = true;
});

lib.setActiveDocument(clients, testFileID);
lib.connectClients(clients);
lib.disableDifBuffering(clients);

lib.getStatusPromise(connectionChecker)
.then(() => {
    let dif = [add(0, 0, 'test')];
    clients[0].propagateLocalDif(dif);
    return lib.getStatusPromise(msgReceivedChecker);
})
.then(() => {
    let dif = [add(0, 0, 'test2')];
    clients[1].propagateLocalDif(dif);
    return lib.getStatusPromise(msgReceivedChecker);
})
.then(() => {
    console.log(lib.sameDocumentState(clients, testFileID));
    server.close();
    lib.cleanFile(testFileID);
});

/*
const serverOrdering = [
    [0],
    //[0, 1, 2, 3],
    [3, 2, 1, 0],
];

lib.getStatusPromise(connectionChecker)
.then(() => {
    lib.setOrdering(server, testFileID, serverOrdering);
    clients[0].propagateLocalDif([to.add(0, 0, 'Sample text with several words.')]);
    return lib.getStatusPromise(msgReceivedChecker, serverOrdering[0].length);
})
.then(() => {
    clients[0].propagateLocalDif(lib.getRowSplitDif(clients[0], testFileID, 0, 6));
    clients[1].propagateLocalDif([to.add(0, 0, "Some ")]);
    clients[2].propagateLocalDif([to.add(0, 6, "s")]);
    clients[3].propagateLocalDif([to.add(0, 11, "s")]);
    return lib.getStatusPromise(msgReceivedChecker, serverOrdering[1].length);
})
.then(() => {
    console.log(lib.sameDocumentState(clients, testFileID));
    console.log(lib.sameServerOrdering(clients));
    //expect(lib.checkSameDocumentState(clients, [ 'Some Samples', ' texts with several words.' ], testFileID)).toBe(true);
    server.close();
    lib.cleanFile(testFileID);
})
.catch(() => {
    console.log('fail');
    server.close();
    lib.cleanFile(testFileID);
});
*/




/*
const serverOrdering = [
    [0, 1, 1, 0, 1, 0, 0, 1, 1, 0], 
    [0, 1, 1, 0, 1, 0],
    [0, 1],
    [0, 1],
];

lib.getStatusPromise(connectionChecker)
.then(() => {
    console.log(lib.sameDocumentState(clients, testFileID));
    console.log(lib.sameServerOrdering(clients));
    lib.setOrdering(server, testFileID, serverOrdering);
    let clientMsgCount = 5;
    lib.sendAdds(clientMsgCount, 2, clients);
    return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
})
.then(() => {
    console.log(lib.sameDocumentState(clients, testFileID));
    console.log(lib.sameServerOrdering(clients));
    let clientMsgCount = 3;
    lib.sendDels(clientMsgCount, 1, clients);
    return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
})
.then(() => {
    console.log(lib.sameDocumentState(clients, testFileID));
    console.log(lib.sameServerOrdering(clients));
    let clientMsgCount = 1;
    lib.sendAdds(clientMsgCount, 1, clients);
    return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
})
.then(() => {
    // document state: ["0141009988776655"]
    console.log(lib.sameDocumentState(clients, testFileID));
    console.log(lib.sameServerOrdering(clients));
    let clientMsgCount = 1;
    lib.sendDels(clientMsgCount, 1, clients);
    return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
})
.then(() => {
    console.log(lib.sameDocumentState(clients, testFileID));
    console.log(lib.sameServerOrdering(clients));
    server.close();
    lib.cleanFile(testFileID);
})
.catch(() => {
    console.log('fail');
    server.close();
    lib.cleanFile(testFileID);
});
*/

/*
lib.getStatusPromise(connectionChecker)
.then(() => {
    //lib.setOrdering(server, testFileID, serverOrdering);

    clients[0].propagateLocalDif([to.add(0, 0, 'a')]);
    clients[1].delayedPropagateLocalDif([to.add(0, 0, 'b')], 200);
    return lib.getStatusPromise(msgReceivedChecker, 2);
})
.then(() => {
    console.log('success');
    console.log(lib.sameDocumentState(clients, testFileID));
    //console.log(lib.checkSameDocumentState(clients, [ '1032210322' ], testFileID));
    console.log(clients[0].getDocument(testFileID));
    server.close();
    lib.cleanFile(testFileID);
})*/
/*.catch(() => {
    console.log('fail');
    server.close();
    lib.cleanFile(testFileID);
});
*/






/*
server.setOrdering([
    4, 8, 6, 8, 6, 
    0, 1, 0, 1, 0, 1, 0, 1,
    0, 0, 1, 0, 1, 1,
    0, 1, 0, 1, 1, 0, 1, 0,
    0, 0, 1, 0, 1, 1
]);

lib.getStatusPromise(connectionChecker)
.then(() => {
    let clientMsgCount = 4;
    lib.sendAdds(clientMsgCount, clients);
    return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
})
.then(() => {
    let clientMsgCount = 3;
    lib.sendDels(clientMsgCount, clients);
    return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
})
.then(() => {
    let clientMsgCount = 4;
    lib.sendAdds(clientMsgCount, clients);
    return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
})
.then(() => {
    let clientMsgCount = 3;
    lib.sendDels(clientMsgCount, clients);
    return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
})
.then(() => {
    console.log(lib.sameDocumentState(clients));
    console.log(clients[0].document);
    console.log(clients[1].document);
    server.close();
})
.catch(() => {
    console.log('fail');
    server.close();
});
*/

/*server.setOrdering([
    3, 2, 4, 4,
    0, 1,
    0, 1, 1, 0,
    0, 1, 1, 0
]);

lib.getStatusPromise(connectionChecker)
.then(() => {
    let clientMsgCount = 1;
    clients[1].log = true;
    test.sendAdds(clientMsgCount, clients);
    return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    // 0011
})
.then(() => {
    let clientMsgCount = 2;
    clients[1].log = true;
    test.sendAdds(clientMsgCount, clients);
    return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    // 110033220011
})
.then(() => {
    // 110033220011
    // 0 => 1033220011 => 13220011 // del 1.0 0.0 0.1 3.1
    // 1 => 1103220011 => 11020011 // del 0.0 3.0 3.1 2.2
    // 1 => 1020011 => 120011
    // 120011
    let clientMsgCount = 2;
    clients[1].log = true;
    test.sendDels(clientMsgCount, clients);
    return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
})
.then(() => {
    console.log(lib.sameDocumentState(clients));
    console.log(clients[0].document);
    console.log(clients[1].document);
    server.close();
})
.catch(() => {
    console.log('fail');
    server.close();
});*/





/*
lib.getStatusPromise(connectionChecker)
.then(() => {
    let clientMsgCount = 4;
    //clients[1].log = true;
    clients[0].propagateLocalDif([[0,0,"0"],[0,1,"0"]]);
    clients[1].propagateLocalDif([[0,0,"4"],[0,1,"4"]]);
    clients[0].propagateLocalDif([[0,0,"1"],[0,1,"1"]]);
    clients[1].propagateLocalDif([[0,0,"5"],[0,1,"5"]]);
    clients[0].propagateLocalDif([[0,0,"2"],[0,1,"2"]]);
    clients[1].propagateLocalDif([[0,0,"6"],[0,1,"6"]]);
    clients[0].propagateLocalDif([[0,0,"3"],[0,1,"3"]]);
    clients[1].propagateLocalDif([[0,0,"7"],[0,1,"7"]]);
    return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
})
.then(() => {
    let clientMsgCount = 3;
    //clients[0].log = true;
    clients[0].propagateLocalDif([[0,0,1],[0,1,1]]);
    clients[0].propagateLocalDif([[0,1,1],[0,2,1]]);
    clients[1].propagateLocalDif([[0,3,1],[0,4,1]]);
    clients[0].propagateLocalDif([[0,2,1],[0,3,1]]);
    clients[1].propagateLocalDif([[0,4,1],[0,5,1]]);
    clients[1].propagateLocalDif([[0,5,1],[0,6,1]]);
    return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
})
.then(() => {
    let clientMsgCount = 4;
    //clients[1].log = true;
    clients[0].propagateLocalDif([[0,0,"0"],[0,1,"0"]]);
    clients[1].propagateLocalDif([[0,0,"4"],[0,1,"4"]]);
    clients[0].propagateLocalDif([[0,0,"1"],[0,1,"1"]]);
    clients[1].propagateLocalDif([[0,0,"5"],[0,1,"5"]]);
    clients[1].propagateLocalDif([[0,0,"6"],[0,1,"6"]]);
    clients[0].propagateLocalDif([[0,0,"2"],[0,1,"2"]]);
    clients[1].propagateLocalDif([[0,0,"7"],[0,1,"7"]]);
    clients[0].propagateLocalDif([[0,0,"3"],[0,1,"3"]]);
    return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
})
.then(() => {
    let clientMsgCount = 3;
    //clients[0].log = true;
    clients[0].propagateLocalDif([[0,0,1],[0,1,1]]);
    clients[0].propagateLocalDif([[0,1,1],[0,2,1]]);
    clients[1].propagateLocalDif([[0,3,1],[0,4,1]]);
    clients[0].propagateLocalDif([[0,2,1],[0,3,1]]);
    clients[1].propagateLocalDif([[0,4,1],[0,5,1]]);
    clients[1].propagateLocalDif([[0,5,1],[0,6,1]]);
    return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
})
.then(() => {
    console.log(lib.sameDocumentState(clients));
    console.log(clients[0].document);
    console.log(clients[1].document);
    server.close();
})
.catch(() => {
    console.log('fail');
    server.close();
});
*/



/*
let sub0 = to.prim.wrapSubdif(to.add(0, 0, '3'));
let sub1 = to.prim.wrapSubdif(to.add(0, 1, '4'));

let excluder0 = to.prim.wrapSubdif(to.add(0, 0, '2'));
let excluder1 = to.prim.wrapSubdif(to.add(0, 1, '2'));

let wDif = [sub0, sub1];
wDif = to.prim.makeIndependant(wDif);
let wLETDif = [excluder1, excluder0];
let wLITDif = [excluder0, excluder1];

let wExcludedDif = to.prim.LET(wDif, wLETDif);
let wIncludedDif = to.prim.LIT(to.prim.deepCopy(wExcludedDif), wLITDif);

console.log(JSON.stringify(wExcludedDif));
console.log();
console.log(JSON.stringify(wIncludedDif));
*/