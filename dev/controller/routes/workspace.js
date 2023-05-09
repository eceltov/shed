const fs = require('fs');
const path = require('path');
const { verifyJWTCookie } = require('../jwtUtils');
const { roles } = require('../../lib/roles');
const accessTypeHandler = require('../../lib/workspaceAccessTypes');

const DatabaseGateway = require('../DatabaseGateway');

/// TODO: should the route make its own gateway?
const database = new DatabaseGateway();
database.initialize();

const appConfigPath = path.join(__dirname, '../../../config.json');
const appConfig = JSON.parse(fs.readFileSync(appConfigPath));

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

    const WebSocketServerURL = `${appConfig.portSettings.WebSocketDomain}:${appConfig.portSettings.workspaceServerPort}`;
    const script = `var WebSocketServerURL = "${WebSocketServerURL}";`;
    res.render('Workspace.jsx', { script });
  });
}

module.exports.register = register;
