function register(app) {
  app.get('/', (req, res) => {
    res.render('Main.jsx');
  });
}

module.exports.register = register;
