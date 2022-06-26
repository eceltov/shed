const fs = require('fs');
const path = require('path');
const WorkspaceServer = require('./server/WorkspaceServer');

const appConfigPath = path.join(__dirname, '../config.json');
const appConfig = JSON.parse(fs.readFileSync(appConfigPath));

const server = new WorkspaceServer();
server.initialize();
server.enableLogging();
server.listen(appConfig.portSettings.workspaceServerPort);
