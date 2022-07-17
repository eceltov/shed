const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const views = require('../views/main/viewEnum');

const DatabaseGateway = require('../../database/DatabaseGateway');

const appConfigPath = path.join(__dirname, '../../../config.json');
const appConfig = JSON.parse(fs.readFileSync(appConfigPath));

/// TODO: should the route make its own gateway?
const database = new DatabaseGateway();
database.initialize();

/**
 * @brief Checks if the JWT cookie is valid. The cookie is cleared if invalid.
 * @param {*} req The express req param.
 * @returns Returns the JWT payload. If the token signature is invalid, returns null.
 */
function handleJWTCookie(req) {
  if (req.cookies.jwt !== undefined) {
    try {
      const payload = jwt.verify(req.cookies.jwt, appConfig.jwtSecret);
      return payload;
    }
    catch {
      res.clearCookie('jwt');
      return null;
    }
  }

  return null;
}

function register(app) {
  app.get('/', (req, res) => {
    let authenticated = handleJWTCookie(req) !== null;

    // if the user authenticates, set the jwt cookie
    if (!authenticated && req.query.token !== undefined) {
      try {
        const payload = jwt.verify(req.query.token, appConfig.jwtSecret);
        res.cookie('jwt', req.query.token);
        authenticated = true;
      }
      catch {
        res.clearCookie('jwt');
      }
    }

    res.render('Main.jsx', { activeView: views.homepage, authenticated });
  });

  app.get('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.render('Main.jsx', { activeView: views.homepage, authenticated: false });
  });

  app.get('/workspaces', (req, res) => {
    const jwtPayload = handleJWTCookie(req);
    const authenticated = jwtPayload !== null;

    if (authenticated) {
      try {
        const workspaces = database.getUserWorkspaces(jwtPayload.id);
        res.render('Main.jsx', { activeView: views.workspaces, authenticated, workspaces });
      }
      catch {
        /// TODO: handle this more gracefully
        console.log('Unable to load workspaces from database. UserID:', jwtPayload.id);
      }
    }
    else {
      res.render('Main.jsx', { activeView: views.homepage, authenticated });
    }
  });
}

module.exports.register = register;
