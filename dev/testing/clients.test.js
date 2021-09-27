var to = require('../lib/dif');
var lib = require('./test_lib');
var Server = require('../server/server_class');
var Client = require('./client_class');
var StatusChecker = require('./status_checker');


var serverURL = 'ws://localhost:8080/';
var server;
var clients;
var clientCount;
var connectionChecker;
var msgReceivedChecker;


beforeEach(() => {
    server = new Server();
    server.listen(8080);
    clientCount = 10;
    connectionChecker = new StatusChecker(clientCount);
    msgReceivedChecker = new StatusChecker(clientCount);
    clients = lib.createClients(clientCount, serverURL, connectionChecker, msgReceivedChecker);
});

afterEach(() => {
    server.close();
});

test('Clients can connect to the server', () => {
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        expect(true).toBe(true);
    })
    .catch(() => {
        expect(false).toBe(true);
    });
});

test('Clients can send and receive messages.', () => {
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        let dif = [to.add(0, 0, 'test')];
        clients[0].propagateLocalDif(dif);
        return lib.getStatusPromise(msgReceivedChecker);
    })
    .then(() => {
        expect(msgReceivedChecker.ready()).toBe(true);
        msgReceivedChecker.reset();
        expect(msgReceivedChecker.ready()).toBe(false);
        let dif = [to.add(0, 0, 'test2')];
        clients[1].propagateLocalDif(dif);
        return lib.getStatusPromise(msgReceivedChecker);
    })
    .then(() => {
        expect(true).toBe(true);
    })
    .catch(() => {
        expect(false).toBe(true);
    });
});


test('Add convergence test (one user adds "a" and the second one "b").', () => {
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        clients[0].CSLatency = 150;
        clients[1].CSLatency = 100;
        let dif0 = [to.add(0, 0, 'a')];
        let dif1 = [to.add(0, 0, 'b')];
        clients[0].propagateLocalDif(dif0);
        clients[1].propagateLocalDif(dif1);
        return lib.getStatusPromise(msgReceivedChecker, 2);
    })
    .then(() => {
        expect(lib.sameDocumentState(clients)).toBe(true);
        expect(clients[0].document).toEqual(['ba']);
    })
    .catch(() => {
        expect(false).toBe(true);
    });
});

test('Add convergence test (all users add random strings).', () => {
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        let clientMsgCount = 10;
        for (let i = 0; i < clientCount * clientMsgCount; i++) {
            let dif = [to.add(0, 0, i.toString())];
            let index = Math.floor(i / clientMsgCount);
            clients[index].propagateLocalDif(dif);
        }
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        expect(lib.sameDocumentState(clients)).toBe(true);
    })
    .catch(() => {
        expect(false).toBe(true);
    });
});
