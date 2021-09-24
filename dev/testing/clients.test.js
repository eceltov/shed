var to = require('../lib/dif');
var Server = require('../server/server_class');
var Client = require('./client_class');
var StatusChecker = require('./status_checker');

/**
 * @brief Returns a new promise linked to a StatusChecker, that will resolve after all the
 *        elements in statusChecker are checked (can happen right away),
 *        or reject if the time limit is exceeded.
 * @param statusChecker Any StatusChecker.
 * @param timeout Time in ms after which the promise will be rejected.
 * @returns A new Promise.
 */
function getStatusPromise(statusChecker, timeout=0) {
    return new Promise((resolve, reject) => {
        if (statusChecker.ready()) resolve();
        statusChecker.setReadyCallback(resolve);
        if (timeout > 0) {
            setTimeout(reject, timeout);
        }
    });
}

/**
 * @brief Creates an array of clients, that will automatically attempt connect.
 * @param count The amount of clients to be created.
 * @param serverURL The URL to which the clients will connect.
 * @param connectionChecker A StatusChecker linked to the clients' connection status.
 * @param msgReceivedChecker A StatusChecker linked to the clients' message received status.
 * @returns An array of clients.
 */
function createClients(count, serverURL, connectionChecker, msgReceivedChecker) {
    let clients = [];
    for (i = 0; i < count; i++) {
        let client = new Client(serverURL);
        client.onMessageReceived(msgReceivedChecker.check, i).onConnection(connectionChecker.check, i).connect();
        clients.push(client);
    }
    return clients;
}

var serverURL = 'ws://localhost:8080/';
var server;
var clients;
var connectionChecker;
var msgReceivedChecker;


beforeEach(() => {
    server = new Server();
    server.listen(8080);
    connectionChecker = new StatusChecker(10);
    msgReceivedChecker = new StatusChecker(10);
    clients = createClients(10, serverURL, connectionChecker, msgReceivedChecker);
});

afterEach(() => {
    server.close();
});

test('Clients can connect to the server', () => {
    return getStatusPromise(connectionChecker)
    .then(() => {
        expect(true).toBe(true);
    })
    .catch(() => {
        expect(false).toBe(true);
    });
});

test('Clients can send and receive messages.', () => {
    return getStatusPromise(connectionChecker)
    .then(() => {
        let dif = to.add(0, 0, 'test');
        clients[0].propagateLocalDif(dif);
        return getStatusPromise(msgReceivedChecker);
    })
    .then(() => {
        expect(msgReceivedChecker.ready()).toBe(true);
        msgReceivedChecker.reset();
        expect(msgReceivedChecker.ready()).toBe(false);
        let dif = to.add(0, 0, 'test2');
        clients[1].propagateLocalDif(dif);
        return getStatusPromise(msgReceivedChecker);
    })
    .then(() => {
        expect(true).toBe(true);
    })
    .catch(() => {
        expect(false).toBe(true);
    });
});
