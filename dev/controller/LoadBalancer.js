class LoadBalancer {
    constructor() {
        //this.clientMessageProcessor = this.clientMessageProcessor.bind(this);
        this.serverPorts = [];
    }

    initialize(config) {
        this.serverPorts = config.serverPorts;
    }
}

module.exports = LoadBalancer;
