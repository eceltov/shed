const fs = require('fs');
const roles = require('../lib/roles');

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

    getUserWorkspaces(userHash) {
        const path = this.usersPath + userHash + ".json";
        let JSONString = fs.readFileSync(path);
        let userMeta = JSON.parse(JSONString);
        return userMeta.workspaces;
    }

    /**
     * @brief Returns the role of a user in a given workspace.
     * @note The role is a number specified in 'roles.js'.
     * @param {*} userHash The hash of the user.
     * @param {*} workspaceHash The hash of the workspace.
     * @returns Returns the role number.
     */
    getUserWorkspaceRole(userHash, workspaceHash) {
        const workspaces = this.getUserWorkspaces(userHash);
        let role = roles.none;

        for (let i = 0; i < workspaces.length; i++) {
            if (workspaces[i].id === workspaceHash) {
                role = workspaces[i].role;
                break;
            }
        }

        return role;
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
