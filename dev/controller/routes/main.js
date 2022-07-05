const views = require('../views/main/viewEnum');

function register(app) {
  app.get('/', (req, res) => {
    res.render('Main.jsx', { activeView: views.homepage });
  });

  app.get('/workspaces', (req, res) => {
    res.render('Main.jsx', { activeView: views.workspaces });
  });

  app.get('/login', (req, res) => {
    res.render('Main.jsx', { activeView: views.login });
  });
}

module.exports.register = register;
