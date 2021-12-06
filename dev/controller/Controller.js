const express = require("express");
const LoadBalancer = require("./LoadBalancer");
const DatabaseGateway = require("./DatabaseGateway");
const fs = require('fs');
const reactViews = require('express-react-views');

///TODO: get route
//var ace = require('./../dev/editor/ace-builds/src-noconflict/ace');
/*var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');*/

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
        this.database.initialize(config);
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

        app.get('/workspaces/:workspaceHash', function(req, res) {
            let workspaceHash = req.params.workspaceHash;
            console.log(workspaceHash);
            res.render('client.js');
        });

        app.listen(8060, function() {
        console.log('Dynamic react example listening on port ' + 8060);
        });

        /* Simple react rendering
        app.set('views', __dirname + '/views');
        app.set('view engine', 'jsx');
        app.engine('jsx', reactViews.createEngine());
        app.use(express.static(path.join(__dirname, 'public')));


        app.locals.something = 'value';
        app.locals.qaz = 'qut';

        app.get('/', routes.index);
        app.get('/users', user.list);

        http.createServer(app).listen(8060, function() {
        console.log('Express server listening on port ' + 8060);
        });*/


        /* Initial file display
        this.app.listen(this.port, () => {
            console.log("Application started and Listening on port " + this.port);
        });
        
        this.app.get("/", (req, res) => {
            res.redirect("/something");
        });

        this.app.get("/something", (req, res) => {
            res.render("controller.html", { data: 5 });
        });*/
    }
}

module.exports = Controller;
