var to = require('../lib/dif');
var lib = require('./test_lib');
var Server = require('./server_class');
var Client = require('./client_class');
var StatusChecker = require('../lib/status_checker');

jest.setTimeout(90 * 1000);

var serverURL = 'ws://localhost:8080/';
var server;
var clients;
var clientCount;
var connectionChecker;
var msgReceivedChecker;

function initializeClients(count) {
    clientCount = count;
    connectionChecker = new StatusChecker(clientCount);
    msgReceivedChecker = new StatusChecker(clientCount);
    clients = lib.createClients(clientCount, serverURL, connectionChecker, msgReceivedChecker);
}

beforeEach(() => {
    server = new Server();
    server.initialize();
    server.listen(8080);
});

afterEach(() => {
    server.close();
});


test('GC does not do anything if all messages are dependant on an empty document.', () => {
    initializeClients(3);
    server.garbageMax = 3; // set the garbage limit low so that GC occurs earlier
    server.GCStartDelay = 200; // delay the start of GC so that all client messages are processed
    let messageOrdering = [
        [0, 1, 2],
    ];
    server.setOrdering(messageOrdering);

    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        clients = lib.reorderClients(clients);
        clients[0].propagateLocalDif([to.add(0, 0, "a")]);
        clients[1].propagateLocalDif([to.add(0, 0, "b")]);
        clients[2].propagateLocalDif([to.add(0, 0, "c")]);
        return lib.getStatusPromise(msgReceivedChecker, messageOrdering[0].length);
    })
    .then(() => {
        return lib.getDelayPromise(500); // delay so that the GC finishes
    })
    .then(() => {
        expect(lib.checkSameDocumentState(clients, [ 'abc' ])).toBe(true);
        expect(lib.checkSameServerOrdering(clients, [[0,0,-1,-1],[1,0,-1,-1],[2,0,-1,-1]])).toBe(true);
        expect(lib.checkSameHBLength(clients, 3)).toBe(true);
        expect(lib.checkBijectionSOHB(clients)).toBe(true);
    })
    .catch(() => {
        expect(false).toBe(true);
    });
});

test('GC collects all entries but the last ones with the same dependancy and their one dependancy', () => {
    initializeClients(3);
    server.garbageMax = 3; // set the garbage limit low so that GC occurs earlier
    let messageOrdering = [
        [0, 1, 2],
        [0, 1, 2],
        [0, 1, 2],
    ];
    server.setOrdering(messageOrdering);
    //server.enableLogging();

    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        clients = lib.reorderClients(clients);
        clients[0].propagateLocalDif([to.add(0, 0, "a")]);
        clients[1].propagateLocalDif([to.add(0, 0, "b")]);
        clients[2].propagateLocalDif([to.add(0, 0, "c")]);
        return lib.getStatusPromise(msgReceivedChecker, messageOrdering[0].length);
    })
    .then(() => {
        clients[0].propagateLocalDif([to.add(0, 0, "d")]);
        clients[1].propagateLocalDif([to.add(0, 0, "e")]);
        clients[2].propagateLocalDif([to.add(0, 0, "f")]);
        return lib.getStatusPromise(msgReceivedChecker, messageOrdering[1].length);
    })
    .then(() => {
        server.GCStartDelay = 200; // delay the start of GC so that all client messages are processed
        clients[0].propagateLocalDif([to.add(0, 0, "g")]);
        clients[1].propagateLocalDif([to.add(0, 0, "h")]);
        clients[2].propagateLocalDif([to.add(0, 0, "i")]);
        return lib.getStatusPromise(msgReceivedChecker, messageOrdering[2].length);
    })
    .then(() => {
        return lib.getDelayPromise(500); // delay so that the GC finishes
    })
    .then(() => {
        expect(lib.checkSameDocumentState(clients, [ 'ghidefabc' ])).toBe(true);
        expect(lib.checkSameServerOrdering(clients, [[2,1,2,0],[0,2,2,1],[1,2,2,1],[2,2,2,1]])).toBe(true);
        expect(lib.checkSameHBLength(clients, 4)).toBe(true);
        expect(lib.checkBijectionSOHB(clients)).toBe(true);
    })
    .catch(() => {
        expect(false).toBe(true);
    });
});

test('GC collects all entries but the last ones with the same dependancy and their one dependancy LARGE', () => {
    initializeClients(10);
    server.garbageMax = 10; // set the garbage limit low so that GC occurs earlier
    let messageOrdering = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    ];
    server.setOrdering(messageOrdering);
    //server.enableLogging();

    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        clients = lib.reorderClients(clients);
        lib.sendAdds(1, 1, clients);
        return lib.getStatusPromise(msgReceivedChecker, messageOrdering[0].length);
    })
    .then(() => {
        lib.sendAdds(1, 1, clients);
        return lib.getStatusPromise(msgReceivedChecker, messageOrdering[1].length);
    })
    .then(() => {
        lib.sendAdds(1, 1, clients);
        return lib.getStatusPromise(msgReceivedChecker, messageOrdering[2].length);
    })
    .then(() => {
        lib.sendAdds(1, 1, clients);
        return lib.getStatusPromise(msgReceivedChecker, messageOrdering[3].length);
    })
    .then(() => {
        lib.sendAdds(1, 1, clients);
        return lib.getStatusPromise(msgReceivedChecker, messageOrdering[4].length);
    })
    .then(() => {
        lib.sendAdds(1, 1, clients);
        return lib.getStatusPromise(msgReceivedChecker, messageOrdering[5].length);
    })
    .then(() => {
        server.GCStartDelay = 200; // delay the start of GC so that all client messages are processed
        lib.sendAdds(1, 1, clients);
        return lib.getStatusPromise(msgReceivedChecker, messageOrdering[6].length);
    })
    .then(() => {
        return lib.getDelayPromise(500); // delay so that the GC finishes
    })
    .then(() => {
        expect(lib.checkSameDocumentState(clients, [ '0123456789012345678901234567890123456789012345678901234567890123456789' ])).toBe(true);
        expect(lib.checkSameServerOrdering(clients, [[9,5,9,4],[0,6,9,5],[1,6,9,5],[2,6,9,5],[3,6,9,5],[4,6,9,5],[5,6,9,5],[6,6,9,5],[7,6,9,5],[8,6,9,5],[9,6,9,5]])).toBe(true);
        expect(lib.checkSameHBLength(clients, 11)).toBe(true);
        expect(lib.checkBijectionSOHB(clients)).toBe(true);
    })
    .catch(() => {
        expect(false).toBe(true);
    });
});

test('GC collects all entries but the last ones with the same dependancy and their one dependancy LARGE GC called after each message', () => {
    initializeClients(10);
    server.garbageMax = 1; // set the garbage limit low so that GC occurs earlier
    let messageOrdering = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    ];
    server.setOrdering(messageOrdering);
    //server.enableLogging();

    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        clients = lib.reorderClients(clients);
        lib.sendAdds(1, 1, clients);
        return lib.getStatusPromise(msgReceivedChecker, messageOrdering[0].length);
    })
    .then(() => {
        lib.sendAdds(1, 1, clients);
        return lib.getStatusPromise(msgReceivedChecker, messageOrdering[1].length);
    })
    .then(() => {
        lib.sendAdds(1, 1, clients);
        return lib.getStatusPromise(msgReceivedChecker, messageOrdering[2].length);
    })
    .then(() => {
        lib.sendAdds(1, 1, clients);
        return lib.getStatusPromise(msgReceivedChecker, messageOrdering[3].length);
    })
    .then(() => {
        lib.sendAdds(1, 1, clients);
        return lib.getStatusPromise(msgReceivedChecker, messageOrdering[4].length);
    })
    .then(() => {
        lib.sendAdds(1, 1, clients);
        return lib.getStatusPromise(msgReceivedChecker, messageOrdering[5].length);
    })
    .then(() => {
        server.GCStartDelay = 200; // delay the start of GC so that all client messages are processed
        lib.sendAdds(1, 1, clients);
        return lib.getStatusPromise(msgReceivedChecker, messageOrdering[6].length);
    })
    .then(() => {
        return lib.getDelayPromise(500); // delay so that the GC finishes
    })
    .then(() => {
        expect(lib.checkSameDocumentState(clients, [ '0123456789012345678901234567890123456789012345678901234567890123456789' ])).toBe(true);
        expect(lib.checkSameServerOrdering(clients, [[9,5,9,4],[0,6,9,5],[1,6,9,5],[2,6,9,5],[3,6,9,5],[4,6,9,5],[5,6,9,5],[6,6,9,5],[7,6,9,5],[8,6,9,5],[9,6,9,5]])).toBe(true);
        expect(lib.checkSameHBLength(clients, 11)).toBe(true);
        expect(lib.checkBijectionSOHB(clients)).toBe(true);
    })
    .catch(() => {
        expect(false).toBe(true);
    });
});

test('GC collects all entries but the last ones with the same dependancy and their one dependancy VERY LARGE', () => {
    server.garbageMax = 10; // set the garbage limit low so that GC occurs earlier
    let clientCount = 10;
    initializeClients(clientCount);
    let clientMsgCount = 5;
    let messagePromises = 5;
    let long = [];
    let messageOrdering = [];
    for (let i = 0; i < clientCount; i++) {
        for (let j = 0; j < clientMsgCount; j++) {
            long.push(i);
        }
    }
    for (let i = 0; i < messagePromises; i++) {
        messageOrdering.push(long);
    }

    server.setOrdering(messageOrdering);
    //server.enableLogging();

    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        clients = lib.reorderClients(clients);
        lib.sendAddsClientID(clientMsgCount, 1, clients);
        return lib.getStatusPromise(msgReceivedChecker, messageOrdering[0].length);
    })
    .then(() => {
        lib.sendAddsClientID(clientMsgCount, 1, clients);
        return lib.getStatusPromise(msgReceivedChecker, messageOrdering[1].length);
    })
    .then(() => {
        lib.sendAddsClientID(clientMsgCount, 1, clients);
        return lib.getStatusPromise(msgReceivedChecker, messageOrdering[2].length);
    })
    .then(() => {
        lib.sendAddsClientID(clientMsgCount, 1, clients);
        return lib.getStatusPromise(msgReceivedChecker, messageOrdering[3].length);
    })
    .then(() => {
        server.GCStartDelay = 200; // delay the start of GC so that all client messages are processed
        lib.sendAddsClientID(clientMsgCount, 1, clients);
        return lib.getStatusPromise(msgReceivedChecker, messageOrdering[4].length);
    })
    .then(() => {
        return lib.getDelayPromise(500); // delay so that the GC finishes
    })
    .then(() => {
        let finalDocumentString = "";
        for (let i = 0; i < messagePromises; i++) {
            for (let j = 0; j < clientCount; j++) {
                finalDocumentString += j.toString().repeat(clientMsgCount);
            }
        }

        let finalServerOrdering = [[9, 19, 9, 14]];
        for (let i = 0; i < clientCount; i++) {
            for (let j = 0; j < clientMsgCount; j++) {
                finalServerOrdering.push([i, 20 + j, 9, 19]);
            }
        }

        
        expect(lib.checkSameDocumentState(clients, [ finalDocumentString ])).toBe(true);
        expect(lib.checkSameServerOrdering(clients, finalServerOrdering)).toBe(true);
        expect(lib.checkSameHBLength(clients, 1 + clientCount * clientMsgCount)).toBe(true);
        expect(lib.checkBijectionSOHB(clients)).toBe(true);
    })
    .catch(() => {
        expect(false).toBe(true);
    });
});
