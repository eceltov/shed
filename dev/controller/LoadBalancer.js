class LoadBalancer {
    constructor() {
        //this.clientMessageProcessor = this.clientMessageProcessor.bind(this);
        this.port = null;
        this.serverURLs = [];
    }

    initialize(config) {
        this.port = config.controllerPort;
        this.serverURLs = config.serverURLs;
    }

    /**
     * @returns Returns the URL of a document server that has the smallest work load,
     *          or null if none available.
     * @note ///TODO: not fully implemented
     */
    getDocServerURL() {
        if (this.serverURLs.length === 0) {
            return null;
        }

        return this.serverURLs[0];
    }

}

module.exports = LoadBalancer;
