const { expressjwt: jwt } = require('express-jwt');
const fs = require('fs');
const path = require('path');

const DatabaseGateway = require('../../database/DatabaseGateway');

function register(app) {
  const appConfigPath = path.join(__dirname, '../../../config.json');
  const appConfig = JSON.parse(fs.readFileSync(appConfigPath));

  /// TODO: should the route make its own gateway?
  database = new DatabaseGateway();
  database.initialize();

  app.get('/workspaceList', jwt({ secret: appConfig.jwtSecret, algorithms: ['HS256'] }), (req, res) => {
    console.log(JSON.stringify(req.auth));

    /// TODO: check if jwt has correct format
    const workspaces = database.getUserWorkspaces(req.auth.id);

    res.json(workspaces);
  });
}

module.exports.register = register;
