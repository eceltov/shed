const express = require("express");
const LoadBalancer = require("./LoadBalancer");
var fs = require('fs');

class Controller {
    constructor() {
        this.app = null;
        this.loadBalancer = null;
        this.port = null;
        this.configPath = "controller/config.json";
    }

    initialize() {
        let configString = fs.readFileSync(this.configPath);
        let config = JSON.parse(configString);
        this.port = config.controllerPort;
        this.loadBalancer = new LoadBalancer();
        this.loadBalancer.initialize(config);
        this.initializeHttpServer();
    }

    initializeHttpServer() {
        this.app = express();
        this.app.listen(this.port, () => {
            console.log("Application started and Listening on port " + this.port);
        });
        
        this.app.get("/", (req, res) => {
            res.send("Hello world!");
        });
    }
}

module.exports = Controller;
