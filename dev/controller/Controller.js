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
        let app = this.app;
        let database = this.database;
        app.set('views', __dirname + "/views");
        app.set('view engine', 'js');
        app.engine('js', reactViews.createEngine());

        app.use(express.static(__dirname + '/public'));

        app.get('/user1', function(req, res) {
            var initialState = {
                workspaces: database.getUserWorkspaces("00000000")
            };
            res.render('Html.js', {data: initialState});
        });

        app.get('/user2', function(req, res) {
            var initialState = {
                workspaces: database.getUserWorkspaces("00000001")
            };
            res.render('Html.js', {data: initialState});
        });

        /* start ugly section */
        app.get('/client/client.js', function(req, res) {
            res.sendFile(path.join(__dirname + '/../client/client.js'));
        });

        app.get('/client/default.css', function(req, res) {
            res.sendFile(path.join(__dirname + '/../client/default.css'));
        });

        app.get('/lib/communication.js', function(req, res) {
            res.sendFile(path.join(__dirname + '/../lib/communication.js'));
        });

        app.get('/lib/dif.js', function(req, res) {
            res.sendFile(path.join(__dirname + '/../lib/dif.js'));
        });

        app.get('/editor/ace-builds/src-noconflict/ace.js', function(req, res) {
            res.sendFile(path.join(__dirname + '/../editor/ace-builds/src-noconflict/ace.js'));
        });

        app.get('/editor/ace-builds/src-noconflict/theme-monokai.js', function(req, res) {
            res.sendFile(path.join(__dirname + '/../editor/ace-builds/src-noconflict/theme-monokai.js'));
        });

        app.get('/editor/ace-builds/src-noconflict/mode-javascript.js', function(req, res) {
            res.sendFile(path.join(__dirname + '/../editor/ace-builds/src-noconflict/mode-javascript.js'));
        });

        app.get('/editor/ace-builds/src-noconflict/worker-javascript.js', function(req, res) {
            res.sendFile(path.join(__dirname + '/../editor/ace-builds/src-noconflict/worker-javascript.js'));
        });
        /* end ugly section */

        app.get('/workspaces', function(req, res) {
            /*let workspaceHash = req.query.hash;
            console.log(workspaceHash);*/
            res.render('Workspace.js');
        });

        app.listen(8060, function() {
        console.log('Dynamic react example listening on port ' + 8060);
        });
    }
}

module.exports = Controller;
