const Server = require('./server/WorkspaceServer');

const server = new Server();
server.initialize();
server.enableLogging();
server.listen(8080);
