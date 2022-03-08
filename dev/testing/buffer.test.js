var to = require('../lib/dif');
var lib = require('./test_lib');
var StatusChecker = require('../lib/status_checker');
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
    lib.connectClients(clients);
}


beforeEach(() => {
    server = new Server();
    server.initialize();
    //server.enableLogging();
    server.listen(8080);
});

afterEach(() => {
    server.close();
    lib.cleanFile(testFileID);
});





test('External message arrived during buffer listen interval.', () => {
  initializeClients(5);
  return lib.getStatusPromise(connectionChecker)
  .then(() => {
    clients[0].propagateLocalDif([to.add(0, 0, 'a')]);
    clients[1].delayedPropagateLocalDif([to.add(0, 0, 'b')], 200);
    return lib.getStatusPromise(msgReceivedChecker, 2);
  })
  .then(() => {
      expect(lib.sameDocumentState(clients, testFileID)).toBe(true);
  });
});