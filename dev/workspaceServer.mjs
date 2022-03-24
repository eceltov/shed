import WorkspaceServer from './server/WorkspaceServer.mjs';

const server = new WorkspaceServer();
server.initialize();
server.enableLogging();
server.listen(8080);
