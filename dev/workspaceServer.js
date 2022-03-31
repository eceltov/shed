const { WorkspaceServer } = require('./server/WorkspaceServer');

const server = new WorkspaceServer();
server.initialize();
server.enableLogging();
server.listen(8080);
