var to = require('../lib/dif');
var lib = require('./test_lib');
var Server = require('../server/server_class');
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


test('GC called after some time collects all but the last message', () => {
    initializeClients(3);
    server.garbageMax = 3; // set the garbage limit low so that GC occurs earlier
    server.GCStartDelay = 200; // delay the start of GC so that all client messages are processed
    let serverOrdering = [
        [0, 1, 2],
    ];
    server.setOrdering(serverOrdering);

    
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        clients[0].propagateLocalDif([to.add(0, 0, "a")]);
        clients[1].propagateLocalDif([to.add(0, 0, "b")]);
        clients[2].propagateLocalDif([to.add(0, 0, "c")]);
        return lib.getStatusPromise(msgReceivedChecker, serverOrdering[0].length);
    })
    .then(() => {
        return lib.getDelayPromise(500); // delay so that the GC finishes
    })
    .then(() => {
        expect(lib.checkSameDocumentState(clients, [ 'abc' ])).toBe(true);
        expect(lib.checkSameServerOrdering(clients, [ [ 2, 0, -1, -1 ] ])).toBe(true);
        expect(lib.checkSameHBLength(clients, 1)).toBe(true);
        expect(lib.checkBijectionSOHB(clients)).toBe(true);
    })
    .catch(() => {
        expect(false).toBe(true);
    });
});
