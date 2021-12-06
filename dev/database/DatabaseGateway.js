const fs = require('fs');

class DatabaseGateway {
    constructor() {
        //this.clientMessageProcessor = this.clientMessageProcessor.bind(this);
        this.usersPath = null;
        this.workspacesPath = null;
        this.configPath = "./database/config.json";
    }

    initialize() {
        let configString = fs.readFileSync(this.configPath);
        let config = JSON.parse(configString);
        this.usersPath = config.usersPath;
        this.workspacesPath = config.workspacesPath;
    }

    getUserWorkspaces(UID) {
        const path = this.usersPath + UID + ".json";
        let JSONString = fs.readFileSync(path);
        let userMeta = JSON.parse(JSONString);
        return userMeta.workspaces;
    }

    getDocumentData(workspaceHash, path) {
        const data = fs.readFileSync(this.workspacesPath + workspaceHash + "/" + path, 'utf8');
        return data;
    }
}

module.exports = DatabaseGateway;
