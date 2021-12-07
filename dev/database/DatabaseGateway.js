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

    createDocumentPath(workspaceHash, path) {
        return this.workspacesPath + workspaceHash + "/" + path;
    }

    getUserWorkspaces(UID) {
        const path = this.usersPath + UID + ".json";
        let JSONString = fs.readFileSync(path);
        let userMeta = JSON.parse(JSONString);
        return userMeta.workspaces;
    }

    getDocumentData(workspaceHash, path) {
        const data = fs.readFileSync(this.createDocumentPath(workspaceHash, path), 'utf8');
        return data;
    }

    writeDocumentData(workspaceHash, path, documentArray) {
        const absolutePath = this.createDocumentPath(workspaceHash, path);
        // erase file content and write first line
        fs.writeFile(absolutePath, documentArray[0], function(err) {
            if (err) {
                console.error(err);
            }
        });
        // append the rest of lines
        for (let i = 1; i < documentArray.length; i++) {
            fs.appendFile(absolutePath, '\n' + documentArray[i], function(err) {
                if (err) {
                    console.error(err);
                }
            });
        }
    }
}

module.exports = DatabaseGateway;
