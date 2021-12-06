const fs = require('fs');

class DatabaseGateway {
    constructor() {
        //this.clientMessageProcessor = this.clientMessageProcessor.bind(this);
        this.databasePath = null;
    }

    initialize(config) {
        this.databasePath = config.databasePath;
    }

    getUserWorkspaces(UID) {
        const path = this.databasePath + "/users/" + UID + ".json";
        let JSONString = fs.readFileSync(path);
        let userMeta = JSON.parse(JSONString);
        return userMeta.workspaces;
    }
}

module.exports = DatabaseGateway;
