const views = require('../views/main/viewEnum');

function register(app) {
  app.get('/', (req, res) => {
    res.render('Main.jsx', { view: views.homepage });
  });

  app.get('/workspaces', (req, res) => {
    res.render('Main.jsx', { view: views.workspaces });
  });

  app.get('/login', (req, res) => {
    res.render('Main.jsx', { view: views.login });
  });
}

module.exports.register = register;
