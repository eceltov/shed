var to = require('../lib/dif');
var lib = require('./test_lib');
var Server = require('../server/server_class');
var Client = require('./client_class');
var StatusChecker = require('./status_checker');

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
    server.listen(8080);
});

afterEach(() => {
    server.close();
});

test('Clients can connect to the server', () => {
    initializeClients(10);
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        expect(true).toBe(true);
    })
    .catch(() => {
        expect(false).toBe(true);
    });
});

test('Clients can send and receive messages.', () => {
    initializeClients(10);
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        let dif = [to.add(0, 0, 'test')];
        clients[0].propagateLocalDif(dif);
        return lib.getStatusPromise(msgReceivedChecker);
    })
    .then(() => {
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


test('Add convergence test 1SpD (one user adds "a" and the second one "b").', () => {
    initializeClients(10);
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

test('Add convergence test 1SpD (all users add random strings).', () => {
    initializeClients(5);
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

test('Add convergence test 2SpD (all users add random strings).', () => {
    initializeClients(5);
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        let clientMsgCount = 10;
        for (let i = 0; i < clientCount * clientMsgCount; i++) {
            let dif = [to.add(0, 0, i.toString()), to.add(0, 1, i.toString())];
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

test('Add convergence test 10SpD (all users add random strings).', () => {
    initializeClients(5);
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        let clientMsgCount = 10;
        for (let i = 0; i < clientCount * clientMsgCount; i++) {
            let dif = [];
            for (let j = 0; j < 10; j++) dif.push(to.add(0, j, i.toString()));
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

test('Add Del Convergence test 1SpD (two characters are added and one deleted).', () => {
    initializeClients(10);
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        let clientMsgCount = 1;
        for (let i = 0; i < clientCount * clientMsgCount; i++) {
            let dif = [to.add(0, 0, i.toString())];
            let index = Math.floor(i / clientMsgCount);
            clients[index].propagateLocalDif(dif);
        }
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        let dif = [to.del(0, 0, 1)];
        clients[0].propagateLocalDif(dif);
        return lib.getStatusPromise(msgReceivedChecker, 1);
    })
    .then(() => {
        expect(lib.sameDocumentState(clients)).toBe(true);
    })
    .catch(() => {
        expect(false).toBe(true);
    });
});

test('Add Del Intention test 1SpD (two users attempt to delete the same character).', () => {
    initializeClients(2);
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        let clientMsgCount = 3;
        clients[1].CSLatency = 50; // so that the document state will be 210543
        for (let i = 0; i < clientCount * clientMsgCount; i++) {
            let dif = [to.add(0, 0, i.toString())];
            let index = Math.floor(i / clientMsgCount);
            clients[index].propagateLocalDif(dif);
        }
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        // expected document state: 210543
        expect(lib.sameDocumentState(clients)).toBe(true);
        expect(clients[0].document[0]).toBe('210543');
        // client0 => 1543 (delete 2 and 0)
        // client1 => 2153 (delete 0 and 4)
        // expected output: 153
        let clientMsgCount = 2;
        for (let i = 0; i < clientCount * clientMsgCount; i++) {
            let dif = [to.del(0, i, 1)];
            let index = Math.floor(i / clientMsgCount);
            clients[index].propagateLocalDif(dif);
        }
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        expect(lib.sameDocumentState(clients)).toBe(true);
        expect(clients[0].document[0]).toBe('153');
    })
    .catch(() => {
        expect(false).toBe(true);
    });
});

test('Add 2SpD Del 1SpD 2C intention test (two users attempt to delete the same character).', () => {
    initializeClients(2);
    clients[1].CSLatency = 50; // so that the first user's messages arrive first
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        let clientMsgCount = 2;
        for (let i = 0; i < clientCount * clientMsgCount; i++) {
            let dif = [to.add(0, 0, i.toString()), to.add(0, 1, i.toString())];
            let index = Math.floor(i / clientMsgCount);
            clients[index].propagateLocalDif(dif);
        }
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        expect(lib.checkSameDocumentState(clients, ['11003322'])).toBe(true);
        let clientMsgCount = 2;
        for (let i = 0; i < clientCount * clientMsgCount; i++) {
            let dif = [to.del(0, i, 1)];
            let index = Math.floor(i / clientMsgCount);
            clients[index].propagateLocalDif(dif);
        }
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        expect(lib.checkSameDocumentState(clients, ['10322'])).toBe(true);
        let clientMsgCount = 2;
        for (let i = 0; i < clientCount * clientMsgCount; i++) {
            let dif = [to.add(0, 0, i.toString()), to.add(0, 1, i.toString())];
            let index = Math.floor(i / clientMsgCount);
            clients[index].propagateLocalDif(dif);
        }
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        expect(lib.checkSameDocumentState(clients, ['1100332210322'])).toBe(true);
        console.log(clients[0].document[0]);
        let clientMsgCount = 2;
        for (let i = 0; i < clientCount * clientMsgCount; i++) {
            let dif = [to.del(0, i, 1)];
            let index = Math.floor(i / clientMsgCount);
            clients[index].propagateLocalDif(dif);
        }
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        expect(lib.checkSameDocumentState(clients, [ '1032210322' ])).toBe(true);
    })
    .catch(() => {
        expect(false).toBe(true);
    });
});

test('Add 2SpD Del 2SpD 2C intention test (two users attempt to delete the same character multiple times).', () => {
    initializeClients(2);
    server.setOrdering([
        4, 8, 6, 8, 6, 
        0, 1, 0, 1, 0, 1, 0, 1,
        0, 0, 1, 0, 1, 1,
        0, 1, 0, 1, 1, 0, 1, 0,
        0, 0, 1, 0, 1, 1
    ]);
    
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        let clientMsgCount = 4;
        test.sendAdds(clientMsgCount, clients);
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        let clientMsgCount = 3;
        test.sendDels(clientMsgCount, clients);
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        let clientMsgCount = 4;
        test.sendAdds(clientMsgCount, clients);
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        let clientMsgCount = 3;
        test.sendDels(clientMsgCount, clients);
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        expect(lib.checkSameDocumentState(clients, [ '3106554431065544' ])).toBe(true);
    })
    .catch(() => {
        expect(false).toBe(true);
    });
});


