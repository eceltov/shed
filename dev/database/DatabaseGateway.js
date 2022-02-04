const fs = require('fs');
const roles = require('../lib/roles');

class DatabaseGateway {
    constructor() {
        //this.clientMessageProcessor = this.clientMessageProcessor.bind(this);
        this.usersPath = null; // absolute path to the user folder ending with '/'
        this.workspacesPath = null; // absolute path to the workspaces folder ending with '/'
        this.workspaceRootFolderPath = null; // relative path to the root folder inside a workspace ending with '/'
        this.fileStructurePath = null; // relative path to the file structure file inside a workspace
        this.configPath = "./database/config.json";
    }

    initialize() {
        let configString = fs.readFileSync(this.configPath);
        let config = JSON.parse(configString);
        this.usersPath = config.usersPath;
        this.workspacesPath = config.workspacesPath;
        this.workspaceRootFolderPath = config.workspaceRootFolderPath;
        this.fileStructurePath = config.fileStructurePath;
    }

    /**
     * @brief Creates an absolute path to a document in a workspace so that it can be accessed.
     * @param {*} workspaceHash The hash of the workspace.
     * @param {*} path The relative path to the document starting at the workspace root.
     * @returns 
     */
    createDocumentPath(workspaceHash, path) {
        return this.getWorkspaceRootPath(workspaceHash) + path;
    }

    /**
     * @param {*} workspaceHash The hash of a workspace.
     * @returns Returns the absolute path to the root folder of a workspace ending with '/'.
     */
    getWorkspaceRootPath(workspaceHash) {
        return this.workspacesPath + workspaceHash + "/" + this.workspaceRootFolderPath;
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

    /**
     * @brief Reads the content of the document and returns it.
     * @param {*} workspaceHash The hash of the workspace.
     * @param {*} path The relative workspace path of the document.
     * @returns Document content.
     */
    getDocumentData(workspaceHash, path) {
        const data = fs.readFileSync(this.createDocumentPath(workspaceHash, path), 'utf8');
        return data;
    }

    getFileStructureJSON(workspaceHash) {
        const raw = fs.readFileSync(this.workspacesPath + workspaceHash + "/" + this.fileStructurePath, 'utf8');
        return JSON.parse(raw);
    }

    createDocument(workspaceHash, path) {
        try {
            fs.writeFileSync(this.createDocumentPath(workspaceHash, path), "");
            return true;
        }
        catch (err) {
            console.error(err);
            return false;
        }
    }

    writeDocumentData(workspaceHash, path, documentArray) {
        try {
            const absolutePath = this.createDocumentPath(workspaceHash, path);
            // erase file content and write first line
            fs.writeFileSync(absolutePath, documentArray[0]);
            // append the rest of lines
            for (let i = 1; i < documentArray.length; i++) {
                fs.appendFileSync(absolutePath, '\n' + documentArray[i]);
            }
        }
        catch (err) {
            console.error(err);
        }
        
    }
}

module.exports = DatabaseGateway;
