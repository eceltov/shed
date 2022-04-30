const express = require('express');
const path = require('path');
const fs = require('fs');
const reactViews = require('express-react-views');
const DatabaseGateway = require('../database/DatabaseGateway');

class Controller {
  constructor() {
    this.app = null;
    this.database = null;
    this.portSettings = null;
    this.portSettingsPath = path.join(__dirname, '../../portSettings.json');
  }

  initialize() {
    this.portSettings = JSON.parse(fs.readFileSync(this.portSettingsPath));
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
    const port = this.portSettings.controllerServerPort;

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
      const WebSocketServerURL = `${this.portSettings.WebSocketDomain}:${this.portSettings.workspaceServerPort}`;
      const script = `var WebSocketServerURL = "${WebSocketServerURL}";`;
      res.render('Workspace.jsx', { script });
    });

    app.listen(port, () => {
      console.log(`Rendering server listening on port ${port}`);
    });
  }
}

module.exports = Controller;
