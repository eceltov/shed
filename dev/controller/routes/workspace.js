const path = require('path');
const fs = require('fs');

const { verifyJWTCookie } = require('../jwtUtils');
const { roles } = require('../lib/roles');
const accessTypeHandler = require('../lib/workspaceAccessTypes');

const DatabaseGateway = require('../DatabaseGateway');

const appConfigPath = path.join(__dirname, '../../volumes/Configuration/config.json');
const appConfig = JSON.parse(fs.readFileSync(appConfigPath));

/// TODO: should the route make its own gateway?
const database = new DatabaseGateway();
database.initialize();

function register(app) {
  app.get('/workspace', (req, res) => {
    const workspaceHash = req.query.hash;

    // return Not Found if the workspace does not exist.
    if (!database.workspaceExists(workspaceHash)) {
      res.status(404).render('errors/NotFound.jsx');
      return;
    }

    const jwtPayload = verifyJWTCookie(req, res);
    let role = roles.none;

    // get the user role if it can be derived from the JWT payload
    if (jwtPayload !== null && typeof jwtPayload.id === 'string') {
      role = database.getUserWorkspaceRole(jwtPayload.id, workspaceHash);
    }

    // return Unauthorized if the user cannot access the workspace
    const accessType = database.getWorkspaceAccessType(workspaceHash);
    if (!accessTypeHandler.canAccessWorkspace(accessType, role)) {
      res.status(401).render('errors/Unauthorized.jsx');
      return;
    }

    // attempt to get info from .env primarily
    const url = process.env.WORKSPACE_SERVER_URL ?? appConfig.FallbackSettings.workspaceServerUrl;
    const port = process.env.WORKSPACE_SERVER_PORT ?? appConfig.FallbackSettings.workspaceServerPort;

    const WebSocketServerURL = `ws://${url}:${port}`;
    const script = `var WebSocketServerURL = "${WebSocketServerURL}"; var BufferingIntervalMilliseconds = ${appConfig.Client.bufferingIntervalMilliseconds}`;
    res.render('Workspace.jsx', { script });
  });
}

module.exports.register = register;
