const express = require("express");
const path = require('path');
const LoadBalancer = require("./LoadBalancer");
const DatabaseGateway = require("../database/DatabaseGateway");
const fs = require('fs');
const reactViews = require('express-react-views');

class Controller {
    constructor() {
        this.app = null;
        this.loadBalancer = null;
        this.database = null;
        this.port = null;
        this.configPath = "controller/config.json";
    }

    initialize() {
        let configString = fs.readFileSync(this.configPath);
        let config = JSON.parse(configString);
        this.port = config.controllerPort;
        this.loadBalancer = new LoadBalancer();
        this.loadBalancer.initialize(config);
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

        app.set('views', __dirname + "/views");
        app.set('view engine', 'js');
        app.engine('js', reactViews.createEngine());

        app.use('/client', express.static(path.join(__dirname, '/../client')));
        app.use('/lib', express.static(path.join(__dirname, '/../lib')));
        app.use('/editor', express.static(path.join(__dirname, '/../editor')));

        app.get('/user1', function(req, res) {
            const initialState = {
                workspaces: database.getUserWorkspaces("00000000")
            };
            res.render('Html.js', {data: initialState});
        });

        app.get('/user2', function(req, res) {
            const initialState = {
                workspaces: database.getUserWorkspaces("00000001")
            };
            res.render('Html.js', {data: initialState});
        });

        app.get('/workspaces', function(req, res) {
            /*let workspaceHash = req.query.hash;
            console.log(workspaceHash);*/
            res.render('Workspace.js');
        });

        app.listen(port, function() {
            console.log('Rendering server listening on port ' + port);
        });
    }
}

module.exports = Controller;
