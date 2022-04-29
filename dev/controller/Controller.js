const express = require('express');
const path = require('path');
const fs = require('fs');
const reactViews = require('express-react-views');
const DatabaseGateway = require('../database/DatabaseGateway');

class Controller {
  constructor() {
    this.app = null;
    this.database = null;
    this.port = null;
    this.configPath = path.join(__dirname, 'config.json');
  }

  initialize() {
    const configString = fs.readFileSync(this.configPath);
    const config = JSON.parse(configString);
    this.port = config.controllerPort;
    this.database = new DatabaseGateway();
    this.database.initialize();
    this.initializeHttpServer();
  }

  initializeHttpServer() {
    /// This example comes from the following source:
    /// https://github.com/reactjs/express-react-views
    this.app = express();
    const app = this.app;
    const database = this.database;
    const port = this.port;

    app.set('views', `${__dirname}/views`);
    app.set('view engine', 'jsx');
    app.engine('jsx', reactViews.createEngine());

    app.use('/client', express.static(path.join(__dirname, '/../client')));
    app.use('/lib', express.static(path.join(__dirname, '/../lib')));
    app.use('/editor', express.static(path.join(__dirname, '/../editor')));

    app.get('/user1', (req, res) => {
      const data = {
        workspaces: database.getUserWorkspaces('00000000'),
        token: '0000',
      };
      res.render('Html.jsx', { data });
    });

    app.get('/user2', (req, res) => {
      const data = {
        workspaces: database.getUserWorkspaces('00000001'),
        token: '0001',
      };
      res.render('Html.jsx', { data });
    });

    app.get('/workspaces', (req, res) => {
      /* let workspaceHash = req.query.hash;
            console.log(workspaceHash); */
      res.render('Workspace.jsx');
    });

    app.listen(port, () => {
      console.log(`Rendering server listening on port ${port}`);
    });
  }
}

module.exports = Controller;
