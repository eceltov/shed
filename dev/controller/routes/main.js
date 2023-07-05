const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const views = require('../views/main/viewEnum');
const { verifyJWTCookie } = require('../jwtUtils');

const DatabaseGateway = require('../DatabaseGateway');

const appConfigPath = path.join(__dirname, '../../volumes/Configuration/config.json');
const appConfig = JSON.parse(fs.readFileSync(appConfigPath));

/// TODO: should the route make its own gateway?
const database = new DatabaseGateway();
database.initialize();

function renderDefaultUnauthView(res) {
  res.render('Main.jsx', { activeView: views.about, authenticated: false });
}

function renderLoginView(res) {
  res.render('Main.jsx', { activeView: views.login, authenticated: false });
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
    renderDefaultUnauthView(res);
  }
}

function register(app) {
  app.get('/', (req, res) => {
    let jwtPayload = verifyJWTCookie(req, res);
    console.log("jwtPayload", jwtPayload);

    // if the user authenticates, set the jwt cookie
    if (req.query.token !== undefined) {
      try {
        const newPayload = jwt.verify(req.query.token, appConfig.JWT.Secret);
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
    renderDefaultUnauthView(res);
  });

  app.get('/login', (req, res) => {
    const jwtPayload = verifyJWTCookie(req, res);
    if (jwtPayload !== null) {
      renderDefaultView(res, jwtPayload);
    }
    else {
      renderLoginView(res);
    }
  });

  app.get('/about', (req, res) => {
    const jwtPayload = verifyJWTCookie(req, res);
    res.render('Main.jsx', { activeView: views.about, authenticated: jwtPayload !== null });
  });

  app.get('/create', (req, res) => {
    const jwtPayload = verifyJWTCookie(req, res);
    if (jwtPayload !== null) {
      res.render('Main.jsx', { activeView: views.createWorkspace, authenticated: true });
    }
    else {
      renderDefaultUnauthView(res);
    }
  });

  app.post('/api/createWorkspace', (req, res) => {
    const jwtPayload = verifyJWTCookie(req, res);
    if (jwtPayload !== null && req.body !== undefined && req.body.name !== undefined) {
      database.createWorkspace(jwtPayload.id, req.body.name);
    }
    else {
      console.log('Invalid create workspace request. Body:', req.body, 'UserID:', jwtPayload.id);
    }
  });

  app.post('/api/deleteWorkspace', (req, res) => {
    const jwtPayload = verifyJWTCookie(req, res);
    if (jwtPayload !== null && req.body !== undefined && req.body.workspaceHash !== undefined) {
      database.deleteWorkspace(jwtPayload.id, req.body.workspaceHash);
    }
    else {
      console.log('Invalid delete workspace request. Body:', req.body, 'UserID:', jwtPayload.id);
    }
  });

  app.post('/api/login', (req, res) => {
    if (req.body !== undefined && req.body.username !== undefined && req.body.password !== undefined) {
      const verificationObj = database.verifyCredentials(req.body.username, req.body.password);
      if (!verificationObj.valid) {
        console.log('Login unsuccessful: Bad credentials.');
        return;
      }

      //database.login(jwtPayload.id, req.body.workspaceHash);
      const token = jwt.sign({
        id: verificationObj.id,
        role: verificationObj.role,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
      }, appConfig.JWT.Secret)
      res.send({token});
    }
    else {
      console.log('Invalid delete workspace request. Body:', req.body, 'UserID:', jwtPayload.id);
    }
  });
}

module.exports.register = register;
