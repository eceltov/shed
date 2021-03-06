/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const express = require('express');
const path = require('path');
const fs = require('fs');
const walker = require('node-walker');
const reactViews = require('express-react-views');

const DatabaseGateway = require('../database/DatabaseGateway');

class Controller {
  constructor() {
    this.app = null;
    this.database = null;
    this.appConfig = null;
    this.appConfigPath = path.join(__dirname, '../../config.json');
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
    const port = this.appConfig.portSettings.controllerServerPort;

    app.set('views', `${__dirname}/views`);
    app.set('view engine', 'jsx');
    app.engine('jsx', reactViews.createEngine());

    app.use(express.json());

    // handle bad jwt
    app.use((err, req, res, next) => {
      if (err.name === 'UnauthorizedError') {
        res.status(401).send('invalid token...');
      }
      else {
        next(err);
      }
    });

    app.use('/client', express.static(path.join(__dirname, '/../client')));
    app.use('/lib', express.static(path.join(__dirname, '/../lib')));
    app.use('/editor', express.static(path.join(__dirname, '/../editor')));

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
