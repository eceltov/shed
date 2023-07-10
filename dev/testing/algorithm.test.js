const { add, del, move, newline, remline } = require('../controller/lib/subdifOps');
const lib = require('./test_lib');
const StatusChecker = require('../controller/lib/status_checker');
const Server = require('../server/WorkspaceServer');

jest.setTimeout(90 * 1000);


var serverURL = 'ws://localhost:8080/';
var server;
var clients;
var clientCount;
var connectionChecker;
var msgReceivedChecker;
const testFileID = 3;

function initializeClients(count) {
    clientCount = count;
    connectionChecker = new StatusChecker(clientCount);
    msgReceivedChecker = new StatusChecker(clientCount);
    clients = lib.createClients(clientCount, serverURL, connectionChecker, msgReceivedChecker);
    lib.setActiveDocument(clients, testFileID);
    lib.disableDifBuffering(clients);
    lib.connectClients(clients);
}


beforeEach(() => {
    server = new Server();
    server.initialize();
    server.testing = true;
    //server.enableLogging();
    server.listen(8080);
});

afterEach(() => {
    server.close();
    lib.cleanFile(testFileID);
});


test('Clients can connect to the server', () => {
    initializeClients(10);
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        expect(true).toBe(true);
    })
});

test('Clients can send and receive messages.', () => {
    initializeClients(10);
    return lib.getStatusPromise(connectionChecker)
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
        expect(true).toBe(true);
    });
});


test('Add convergence test 1SpD (one user adds "a" and the second one "b").', () => {
    initializeClients(10);
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        clients[0].CSLatency = 150;
        clients[1].CSLatency = 100;
        let dif0 = [add(0, 0, 'a')];
        let dif1 = [add(0, 0, 'b')];
        clients[0].propagateLocalDif(dif0);
        clients[1].propagateLocalDif(dif1);
        return lib.getStatusPromise(msgReceivedChecker, 2);
    })
    .then(() => {
        expect(lib.checkSameDocumentState(clients, ['ba'], testFileID)).toBe(true);
    });
});

test('Add convergence test 1SpD (all users add random strings).', () => {
    initializeClients(5);
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        let clientMsgCount = 10;
        for (let i = 0; i < clientCount * clientMsgCount; i++) {
            let dif = [add(0, 0, i.toString())];
            let index = Math.floor(i / clientMsgCount);
            clients[index].propagateLocalDif(dif);
        }
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        expect(lib.sameDocumentState(clients, testFileID)).toBe(true);
    });
});

test('Add convergence test 2SpD (all users add random strings).', () => {
    initializeClients(5);
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        let clientMsgCount = 10;
        for (let i = 0; i < clientCount * clientMsgCount; i++) {
            let dif = [add(0, 0, i.toString()), add(0, 1, i.toString())];
            let index = Math.floor(i / clientMsgCount);
            clients[index].propagateLocalDif(dif);
        }
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        expect(lib.sameDocumentState(clients, testFileID)).toBe(true);
    });
});

test('Add convergence test 5SpD (all users add random strings).', () => {
    initializeClients(5);
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        let clientMsgCount = 5;
        for (let i = 0; i < clientCount * clientMsgCount; i++) {
            let dif = [];
            for (let j = 0; j < 5; j++) dif.push(add(0, j, i.toString()));
            let index = Math.floor(i / clientMsgCount);
            clients[index].propagateLocalDif(dif);
        }
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        expect(lib.sameDocumentState(clients, testFileID)).toBe(true);
    });
});

test('Add Del Convergence test 1SpD (two characters are added and one deleted).', () => {
    initializeClients(10);
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        let clientMsgCount = 1;
        for (let i = 0; i < clientCount * clientMsgCount; i++) {
            let dif = [add(0, 0, i.toString())];
            let index = Math.floor(i / clientMsgCount);
            clients[index].propagateLocalDif(dif);
        }
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        let dif = [del(0, 0, 1)];
        clients[0].propagateLocalDif(dif);
        return lib.getStatusPromise(msgReceivedChecker, 1);
    })
    .then(() => {
        expect(lib.sameDocumentState(clients, testFileID)).toBe(true);
    });
});

test('Add Del Intention test 1SpD (two users attempt to delete the same character).', () => {
    initializeClients(2);
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        let clientMsgCount = 3;
        clients[1].CSLatency = 50; // so that the document state will be 210543
        for (let i = 0; i < clientCount * clientMsgCount; i++) {
            let dif = [add(0, 0, i.toString())];
            let index = Math.floor(i / clientMsgCount);
            clients[index].propagateLocalDif(dif);
        }
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        // expected document state: 210543
        expect(lib.checkSameDocumentState(clients, [ '210543' ], testFileID)).toBe(true);
        // client0 => 1543 (delete 2 and 0)
        // client1 => 2153 (delete 0 and 4)
        // expected output: 153
        let clientMsgCount = 2;
        for (let i = 0; i < clientCount * clientMsgCount; i++) {
            let dif = [del(0, i, 1)];
            let index = Math.floor(i / clientMsgCount);
            clients[index].propagateLocalDif(dif);
        }
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        expect(lib.checkSameDocumentState(clients, [ '153' ], testFileID)).toBe(true);
    });
});

test('Add 2SpD Del 1SpD 2C intention test (two users attempt to delete the same character).', () => {
    initializeClients(2);
    const serverOrdering = [
        [0, 1, 0, 1],
        [0, 1, 0, 1],
        [0, 1, 0, 1],
        [0, 1, 0, 1]
    ];

    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        expect(lib.sameDocumentState(clients, testFileID)).toBe(true);
        lib.setOrdering(server, testFileID, serverOrdering);
        let clientMsgCount = 2;
        lib.sendAdds(clientMsgCount, 2, clients);
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        expect(lib.checkSameDocumentState(clients, ['11003322'], testFileID)).toBe(true);
        let clientMsgCount = 2;
        lib.sendDels(clientMsgCount, 1, clients);
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        expect(lib.checkSameDocumentState(clients, ['10322'], testFileID)).toBe(true);
        let clientMsgCount = 2;
        lib.sendAdds(clientMsgCount, 2, clients);
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        expect(lib.checkSameDocumentState(clients, ['1100332210322'], testFileID)).toBe(true);
        let clientMsgCount = 2;
        lib.sendDels(clientMsgCount, 1, clients);
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        expect(lib.checkSameDocumentState(clients, [ '1032210322' ], testFileID)).toBe(true);
    });
});

test('Add 2SpD Del 2SpD 2C intention test (two users attempt to delete the same character multiple times).', () => {
    initializeClients(2);
    const serverOrdering = [
        [0, 1, 0, 1, 0, 1, 0, 1],
        [0, 0, 1, 0, 1, 1],
        [0, 1, 0, 1, 1, 0, 1, 0],
        [0, 0, 1, 0, 1, 1]
    ];
    
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        expect(lib.sameDocumentState(clients, testFileID)).toBe(true);
        lib.setOrdering(server, testFileID, serverOrdering);
        let clientMsgCount = 4;
        lib.sendAdds(clientMsgCount, 2, clients);
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        expect(lib.sameDocumentState(clients, testFileID)).toBe(true);
        let clientMsgCount = 3;
        lib.sendDels(clientMsgCount, 2, clients);
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        expect(lib.sameDocumentState(clients, testFileID)).toBe(true);
        let clientMsgCount = 4;
        lib.sendAdds(clientMsgCount, 2, clients);
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        expect(lib.sameDocumentState(clients, testFileID)).toBe(true);
        let clientMsgCount = 3;
        lib.sendDels(clientMsgCount, 2, clients);
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        expect(lib.checkSameDocumentState(clients, [ '3106554431065544' ], testFileID)).toBe(true);
    });
});

test('Add 6SpD Del 4SpD 5C intention test (multiple users attempt to delete the same character multiple times).', () => {
    initializeClients(5);
    const serverOrdering = [
        [0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 4, 3, 2, 1, 0, 0, 1, 2, 3, 4, 4, 3, 2, 1, 0], 
        [0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 4, 3, 2, 1, 0],
        [0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 4, 3, 2, 1, 0],
        [0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 4, 3, 2, 1, 0],
    ];
    
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        expect(lib.sameDocumentState(clients, testFileID)).toBe(true);
        lib.setOrdering(server, testFileID, serverOrdering);
        let clientMsgCount = 5;
        lib.sendAdds(clientMsgCount, 6, clients);
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        expect(lib.sameDocumentState(clients, testFileID)).toBe(true);
        let clientMsgCount = 3;
        lib.sendDels(clientMsgCount, 4, clients);
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        expect(lib.sameDocumentState(clients, testFileID)).toBe(true);
        let clientMsgCount = 3;
        lib.sendAdds(clientMsgCount, 6, clients);
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        expect(lib.sameDocumentState(clients, testFileID)).toBe(true);
        let clientMsgCount = 3;
        lib.sendDels(clientMsgCount, 4, clients);
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        expect(lib.checkSameDocumentState(
            clients,
            [ '244333333888888777777666666111111111111111111000000999999111111444444111111333333111111222222400999999888888777777666666555555111111444444111111333333111111222222111111111111111111000000111111999999111111888888111111777777111111666666111111555555222222444444222222333333222222222222222222111111222222000000' ],
            testFileID
        )).toBe(true);
    });
});

test('Newline 1SpD 5C simple convergence test.', () => {
    initializeClients(5);
    
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        clients[0].propagateLocalDif([newline(0, 0)]);
        return lib.getStatusPromise(msgReceivedChecker);
    })
    .then(() => {
        expect(lib.checkSameDocumentState(clients, [ '', ''], testFileID)).toBe(true);
    });
});

test('Newline 3SpD 5C convergence test.', () => {
    initializeClients(5);
    
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        let clientMsgCount = 2;
        for (let i = 0; i < clientCount * clientMsgCount; i++) {
            let dif = [newline(0, 0), newline(1, 0), newline(2, 0)];
            let index = Math.floor(i / clientMsgCount);
            clients[index].propagateLocalDif(dif);
        }
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        let clientMsgCount = 2;
        for (let i = 0; i < clientCount * clientMsgCount; i++) {
            let dif = [newline(0, 0), newline(1, 0), newline(2, 0)];
            let index = Math.floor(i / clientMsgCount);
            clients[index].propagateLocalDif(dif);
        }
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        let document = [];
        for (let i = 0; i < 61; i++) document.push('');
        expect(lib.checkSameDocumentState(clients, document, testFileID)).toBe(true);
    });
});

test('Newline Add 1SpD 5C convergence test.', () => {
    initializeClients(5);
    
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        clients[0].propagateLocalDif([add(0, 0, 'Sample text with several words.')]);
        return lib.getStatusPromise(msgReceivedChecker);
    })
    .then(() => {
        clients[0].propagateLocalDif([newline(0, 0)]);
        return lib.getStatusPromise(msgReceivedChecker);
    })
    .then(() => {
        expect(lib.checkSameDocumentState(clients, [ '', 'Sample text with several words.' ], testFileID)).toBe(true);
    });
});

test('Newline 3SpD Remline 2-3SpD 5C convergence test.', () => {
    initializeClients(5);
    let numberOfLines = 1; // the doc starts with one line
    
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        const clientMsgCount = 2;
        for (let i = 0; i < clientCount * clientMsgCount; i++) {
            let dif = [newline(0, 0), newline(1, 0), newline(2, 0)];
            let index = Math.floor(i / clientMsgCount);
            clients[index].propagateLocalDif(dif);
        }
        numberOfLines += clientCount * clientMsgCount * 3;
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        // each client wants to remove clientMsgCount * 2 lines
        // every client wants to remove the same lines, so only clientMsgCount * 2 lines
        // should be deleted in total
        const clientMsgCount = 2;
        for (let i = 0; i < clientCount * clientMsgCount; i++) {
            let dif = [remline(0, 0), remline(0, 0)];
            let index = Math.floor(i / clientMsgCount);
            clients[index].propagateLocalDif(dif);
        }
        numberOfLines -= clientMsgCount * 2;
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        const clientMsgCount = 2;
        for (let i = 0; i < clientCount * clientMsgCount; i++) {
            let dif = [newline(0, 0), newline(1, 0), newline(2, 0)];
            let index = Math.floor(i / clientMsgCount);
            clients[index].propagateLocalDif(dif);
        }
        numberOfLines += clientCount * clientMsgCount * 3;
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        // each client wants to remove clientMsgCount * 3 lines
        // every client wants to remove the same lines, so only clientMsgCount * 3 lines
        // should be deleted in total
        const clientMsgCount = 2;
        for (let i = 0; i < clientCount * clientMsgCount; i++) {
            let dif = [remline(1, 0), remline(4, 0), remline(6, 0)];
            let index = Math.floor(i / clientMsgCount);
            clients[index].propagateLocalDif(dif);
        }
        numberOfLines -= clientMsgCount * 3;
        return lib.getStatusPromise(msgReceivedChecker, clientCount * clientMsgCount);
    })
    .then(() => {
        let document = [];
        for (let i = 0; i < numberOfLines; i++) document.push('');
        expect(lib.checkSameDocumentState(clients, document, testFileID)).toBe(true);
    });
});

test('Newline 5C simple row split convergence test.', () => {
    initializeClients(5);
    
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        clients[0].propagateLocalDif([add(0, 0, 'Sample text with several words.')]);
        return lib.getStatusPromise(msgReceivedChecker);
    })
    .then(() => {
        clients[0].propagateLocalDif(lib.getRowSplitDif(clients[0], testFileID, 0, 6));
        return lib.getStatusPromise(msgReceivedChecker);
    })
    .then(() => {
        expect(lib.checkSameDocumentState(clients, [ 'Sample', ' text with several words.' ], testFileID)).toBe(true);
    });
});

test('Newline 5C convergence test.', () => {
    initializeClients(5);
    const serverOrdering = [
        [0],
        [3, 2, 1, 0]
    ];
    
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        lib.setOrdering(server, testFileID, serverOrdering);
        clients[0].propagateLocalDif([add(0, 0, 'Sample text with several words.')]);
        return lib.getStatusPromise(msgReceivedChecker, serverOrdering[0].length);
    })
    .then(() => {
        clients[0].propagateLocalDif(lib.getRowSplitDif(clients[0], testFileID, 0, 6));
        clients[1].propagateLocalDif([add(0, 0, "Some ")]);
        clients[2].propagateLocalDif([add(0, 6, "s")]);
        clients[3].propagateLocalDif([add(0, 11, "s")]);
        return lib.getStatusPromise(msgReceivedChecker, serverOrdering[1].length);
    })
    .then(() => {
        expect(lib.checkSameDocumentState(clients, [ 'Some Samples', ' texts with several words.' ], testFileID)).toBe(true);
    });
});

test('Remline Add 5C convergence test (adding text to a new line and deleting it).', () => {
    initializeClients(5);
    const serverOrdering = [
        [0],
        [0, 1]
    ];
    
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        lib.setOrdering(server, testFileID, serverOrdering);
        clients[0].propagateLocalDif([newline(0, 0)]);
        return lib.getStatusPromise(msgReceivedChecker);
    })
    .then(() => {
        clients[0].propagateLocalDif([add(1, 0, "text")]);
        clients[1].propagateLocalDif([remline(0, 0)]);
        return lib.getStatusPromise(msgReceivedChecker, 2);
    })
    .then(() => {
        expect(lib.checkSameDocumentState(clients, [ 'text' ], testFileID)).toBe(true);
    });
});

test('Newline Remline Add 5C conflict test (adding text, newlining and remlining on the same row).', () => {
    initializeClients(5);
    const serverOrdering = [
        [0],
        [0, 1, 2, 3, 4]
    ];
    
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        lib.setOrdering(server, testFileID, serverOrdering);
        clients[0].propagateLocalDif([newline(0, 0)]);
        return lib.getStatusPromise(msgReceivedChecker, serverOrdering[0].length);
    })
    .then(() => {
        clients[0].propagateLocalDif([add(1, 0, "text")]);
        clients[1].propagateLocalDif([remline(0, 0)]);
        clients[2].propagateLocalDif([add(1, 0, "sample")]);
        clients[3].propagateLocalDif([newline(1, 0)]);
        clients[4].propagateLocalDif([add(1, 0, "random")]);
        return lib.getStatusPromise(msgReceivedChecker, serverOrdering[1].length);
    })
    .then(() => {
        expect(lib.checkSameDocumentState(clients, [ 'textsample', 'random' ], testFileID)).toBe(true);
    });
});
