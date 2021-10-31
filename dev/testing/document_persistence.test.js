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
var docFolderPath = 'document_states/';

function initializeClients(count) {
    clientCount = count;
    connectionChecker = new StatusChecker(clientCount);
    msgReceivedChecker = new StatusChecker(clientCount);
    clients = lib.createClients(clientCount, serverURL, connectionChecker, msgReceivedChecker);
}

function getSingleClientWrapper() {
    let singleConnectionChecker = new StatusChecker(1);
    let singleMsgReceivedChecker = new StatusChecker(1);
    let client = lib.createClient(serverURL, singleConnectionChecker, singleMsgReceivedChecker);
    return {
        client: client,
        connectionChecker: singleConnectionChecker,
        msgReceivedChecker: singleMsgReceivedChecker
    };
}


beforeEach(() => {
    server = new Server();
});

afterEach(() => {
    server.close();
});


test('The server can read a document stored in a file', () => {
    server.initialize(docFolderPath + 'doc1.txt');
    expect(server.document).toEqual([ 'some', 'text', '' ]);
});


test('Connected clients will have the initial server document (no document changes)', () => {
    server.initialize(docFolderPath + 'doc2.txt');
    server.listen(8080);
    initializeClients(10);
    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        expect(lib.checkSameDocumentState(clients, [ 'some', 'text', '' ])).toBe(true);
    })
    .catch(() => {
        expect(false).toBe(true);
    });
});


test('A client connected later will have the initial server document (no document changes)', () => {
    server.initialize(docFolderPath + 'doc3.txt');
    server.listen(8080);
    initializeClients(10);

    let clientWrapper;

    return lib.getStatusPromise(connectionChecker)
    .then(() => {
        expect(lib.checkSameDocumentState(clients, [ 'some', 'text', '' ])).toBe(true);
        clientWrapper = getSingleClientWrapper();
        return lib.getStatusPromise(clientWrapper.connectionChecker);
    })
    .then(() => {
        clients.push(clientWrapper.client);
        expect(lib.checkSameDocumentState(clients, [ 'some', 'text', '' ])).toBe(true);
    })
    .catch(() => {
        expect(false).toBe(true);
    });
});
