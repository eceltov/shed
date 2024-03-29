const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const views = require('../views/main/viewEnum');
const { verifyJWTCookie } = require('../jwtUtils');

const DatabaseGateway = require('../DatabaseGateway');

const appConfigPath = path.join(__dirname, '../../volumes/Configuration/config.json');
const appConfig = JSON.parse(fs.readFileSync(appConfigPath));

const database = new DatabaseGateway();
database.initialize();

function renderLoginView(res) {
  res.render('Main.jsx', { activeView: views.login, authenticated: false });
}

// the default view is always the login view
function renderDefaultUnauthView(res) {
  renderLoginView(res);
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

    // if the user authenticates, set the jwt cookie
    if (req.query.token !== undefined) {
      try {
        const newPayload = jwt.verify(req.query.token, appConfig.JWT.Secret);
        jwtPayload = newPayload;
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
      const result = database.createWorkspace(jwtPayload.id, req.body.name);
      if (result.workspacePresent) {
        res.send({
          status: 'failed',
          error: 'Workspace name taken',
        });
      }
      else if (!result.successful) {
        res.send({
          status: 'failed',
          error: 'Database failure',
        });
      }
      else {
        res.send({
          status: 'successful',
          error: '',
        });
      }
    }
    else {
      console.log('Invalid create workspace request. Body:', req.body, 'UserID:', jwtPayload.id);
    }
  });

  app.post('/api/login', (req, res) => {
    if (req.body !== undefined && req.body.username !== undefined && req.body.password !== undefined) {
      const verificationObj = database.verifyCredentials(req.body.username, req.body.password);
      if (!verificationObj.valid) {
        console.log('Login unsuccessful: Bad credentials.');
        res.send({error: 'Bad Credentials.'});
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
