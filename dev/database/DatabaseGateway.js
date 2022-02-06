const fs = require('fs');
const roles = require('../lib/roles');

class DatabaseGateway {
    constructor() {
        this.paths = null;
        // this.paths.usersPath: absolute path to the user folder ending with '/'
        // this.paths.workspacesPath: absolute path to the workspaces folder ending with '/'
        // this.paths.workspaceRootFolderPath: relative path to the root folder inside a workspace ending with '/'
        // this.paths.fileStructurePath: relative path to the file structure file inside a workspace
        // this.paths.pathMapPath: relative path to the workspace map from file IDs to their paths
        this.configPath = "./database/config.json";
    }

    initialize() {
        let configString = fs.readFileSync(this.configPath);
        let config = JSON.parse(configString);
        this.paths = config.paths;
        /*this.paths.usersPath = config.usersPath;
        this.paths.workspacesPath = config.workspacesPath;
        this.paths.workspaceRootFolderPath = config.workspaceRootFolderPath;
        this.paths.fileStructurePath = config.fileStructurePath;*/
    }

    /**
     * @brief Creates an absolute path to a document or folder in a workspace so that it can be accessed.
     * @param {*} workspaceHash The hash of the workspace containing the document or folder.
     * @param {*} path The relative path to the document or folder starting at the workspace root.
     * @returns 
     */
    createPath(workspaceHash, path) {
        return this.getWorkspaceRootPath(workspaceHash) + path;
    }

    /**
     * @param {*} workspaceHash The hash of a workspace.
     * @returns Returns the absolute path to the root folder of a workspace ending with '/'.
     */
    getWorkspaceRootPath(workspaceHash) {
        return this.paths.workspacesPath + workspaceHash + "/" + this.paths.workspaceRootFolderPath;
    }

    getUserWorkspaces(userHash) {
        const path = this.paths.usersPath + userHash + ".json";
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
        const data = fs.readFileSync(this.createPath(workspaceHash, path), 'utf8');
        return data;
    }

    getFileStructureJSON(workspaceHash) {
        const raw = fs.readFileSync(this.paths.workspacesPath + workspaceHash + "/" + this.paths.fileStructurePath, 'utf8');
        return JSON.parse(raw);
    }

    getPathMapJSON(workspaceHash) {
        const raw = fs.readFileSync(this.paths.workspacesPath + workspaceHash + "/" + this.paths.pathMapPath, 'utf8');
        return JSON.parse(raw);
    }

    /**
     * @brief Replaces the old file structure with a new one.
     * @param {*} workspaceHash The hash of the workspace of the file structure.
     * @param {*} JSONString The stringified file structure JSON data.
     */
    changeFileStructure(workspaceHash, JSONString) {
        fs.writeFileSync(this.paths.workspacesPath + workspaceHash + "/" + this.paths.fileStructurePath, JSONString);
    }

    changePathMap(workspaceHash, JSONString) {
        fs.writeFileSync(this.paths.workspacesPath + workspaceHash + "/" + this.paths.pathMapPath, JSONString);
    }

    /**
     * @brief Attempts to create a document.
     * @param {*} workspaceHash The hash of the workspace in which to create the document.
     * @param {*} path The path of the document.
     * @returns Returns whether the document was created successfully.
     */
    createDocument(workspaceHash, path) {
        const absolutePath = this.createPath(workspaceHash, path);
        try {
            fs.writeFileSync(absolutePath, "");
            return true;
        }
        catch (err) {
            console.error(err);
            return false;
        }
    }

    /**
     * @ Attempts to create a folder.
     * @param {*} workspaceHash The hash of the workspace in which to create the folder.
     * @param {*} path The path of the folder.
     * @returns Returns whether the folder was created successfully.
     */
    ///TODO: always returns true
    createFolder(workspaceHash, path) {
        const absolutePath = this.createPath(workspaceHash, path);
        fs.mkdirSync(absolutePath);
        return true;
    }

    ///TODO: always returns true
    deleteDocument(workspaceHash, path) {
        const absolutePath = this.createPath(workspaceHash, path);
        fs.rmSync(absolutePath);
        return true;
    }

    /**
     * @brief Deletes a folder and all nested items.
     * @param {*} workspaceHash The hash of the workspace containing the folder.
     * @param {*} path The relative path to the folder.
     * @returns Returns whether the folder was deleted successfully.
     */
    ///TODO: always returns true
    deleteFolder(workspaceHash, path) {
        const absolutePath = this.createPath(workspaceHash, path);
        fs.rmSync(absolutePath, { recursive: true });
        return true;
    }

    ///TODO: always returns true
    renameFile(workspaceHash, oldPath, newPath) {
        const absoluteOldPath = this.createPath(workspaceHash, oldPath);
        const absoluteNewPath = this.createPath(workspaceHash, newPath);

        fs.renameSync(absoluteOldPath, absoluteNewPath);
        return true;
    }

    writeDocumentData(workspaceHash, path, documentArray) {
        try {
            const absolutePath = this.createPath(workspaceHash, path);
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
