const fs = require('fs');
const path = require('path');
const WorkspaceServer = require('./server/WorkspaceServer');

const portSettingsPath = path.join(__dirname, '../portSettings.json');
const portSettings = JSON.parse(fs.readFileSync(portSettingsPath));

const server = new WorkspaceServer();
server.initialize();
server.enableLogging();
server.listen(portSettings.workspaceServerPort);
