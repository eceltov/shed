/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const walker = require('node-walker');
const reactViews = require('express-react-views');

const DatabaseGateway = require('./DatabaseGateway');

class Controller {
  constructor() {
    this.app = null;
    this.database = null;
    this.appConfig = null;
    this.appConfigPath = path.join(__dirname, '../volumes/Configuration/config.json');
    this.routesFolder = path.join(__dirname, 'routes');
  }

  initialize() {
    this.appConfig = JSON.parse(fs.readFileSync(this.appConfigPath));
    this.database = new DatabaseGateway();
    this.database.initialize();
    this.initializeHttpServer();
  }

  initializeHttpServer() {
    this.app = express();
    const app = this.app;
    const database = this.database;
    const port = this.appConfig.FallbackSettings.controllerServerPort;

    app.set('views', `${__dirname}/views`);
    app.set('view engine', 'jsx');
    app.engine('jsx', reactViews.createEngine());

    app.use(express.json());
    app.use(cookieParser());
    app.use(bodyParser.urlencoded({ extended: true }));

    // handle bad jwt
    /*app.use((err, req, res, next) => {
      if (err.name === 'UnauthorizedError') {
        res.status(401).send('invalid token...');
      }
      else {
        next(err);
      }
    });*/

    app.use('/client', express.static(path.join(__dirname, '/client/bundles')));
    app.use('/styles', express.static(path.join(__dirname, '/client/styles')));
    app.use('/editor', express.static(path.join(__dirname, '/editor')));
    app.use('/main/static', express.static(path.join(__dirname, '/views/main/static')));

    // load routes
    walker(this.routesFolder, (err, filename, next) => {
      if (err) {
        throw err;
      }
      if (filename !== null) {
        const route = require(filename);
        route.register(app);
      }
      if (next) {
        next();
      }
      else {
        app.listen(port, () => {
          console.log(`Rendering server listening on port ${port}`);
        });
      }
    });
  }
}

module.exports = Controller;
