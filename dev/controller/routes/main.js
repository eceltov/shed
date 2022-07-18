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
 * @param {*} req The express req parameter.
 * @param {*} res The express res parameter.
 * @returns Returns the JWT payload. If the token signature is invalid, returns null.
 */
function handleJWTCookie(req, res) {
  if (req.cookies.jwt !== undefined) {
    try {
      const payload = jwt.verify(req.cookies.jwt, appConfig.jwtSecret);
      /// TODO: make sure the payload has the correct shape
      /// TODO: check expiration
      return payload;
    }
    catch {
      res.clearCookie('jwt');
      return null;
    }
  }

  return null;
}

/**
 * @brief Renders the users' workspaces if authenticated or the about screen otherwise.
 * @param {*} res The express res parameter.
 * @param {*} jwtPayload JWT payload of the user. If null or omitted, the user is handled as
 *  if he was unauthenticated.
 */
function renderDefaultView(res, jwtPayload = null) {
  if (jwtPayload !== null) {
    try {
      const workspaces = database.getUserWorkspaces(jwtPayload.id);
      res.render('Main.jsx', { activeView: views.workspaces, authenticated: true, workspaces });
    }
    catch {
      /// TODO: handle this more gracefully
      console.log('Unable to load workspaces from database. UserID:', jwtPayload.id);
    }
  }
  else {
    res.render('Main.jsx', { activeView: views.about, authenticated: false });
  }
}

function register(app) {
  app.get('/', (req, res) => {
    let jwtPayload = handleJWTCookie(req, res);

    // if the user authenticates, set the jwt cookie
    if (req.query.token !== undefined) {
      try {
        const newPayload = jwt.verify(req.query.token, appConfig.jwtSecret);
        jwtPayload = newPayload;
        /// TODO: make sure the payload has the correct shape
        // refresh the cookie
        res.cookie('jwt', req.query.token);
      }
      catch {
        // Nothing needs to be done. The previous token is still valid.
      }
    }

    renderDefaultView(res, jwtPayload);
  });

  app.get('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.render('Main.jsx', { activeView: views.about, authenticated: false });
  });

  app.get('/about', (req, res) => {
    const jwtPayload = handleJWTCookie(req, res);
    res.render('Main.jsx', { activeView: views.about, authenticated: jwtPayload !== null });
  });
}

module.exports.register = register;
