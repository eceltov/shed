const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { roles } = require('../lib/roles');

class DatabaseGateway {
  constructor() {
    this.paths = null;
    this.configPath = path.join(__dirname, 'config.json');
    this.sha256Hasher = null;
    this.workspaceHashSalt = null;
  }

  initialize() {
    const configString = fs.readFileSync(this.configPath);
    const config = JSON.parse(configString);
    this.paths = config.paths;
    this.paths.usersPath = path.join(__dirname, 'users/');
    this.paths.workspacesPath = path.join(__dirname, 'workspaces/');
    this.sha256Hasher = crypto.createHmac('sha256', config.workspaceHashSalt);
  }

  /**
     * @brief Creates an absolute path to a document or folder in a workspace so that
     *  it can be accessed.
     * @param {*} workspaceHash The hash of the workspace containing the document or folder.
     * @param {*} relativePath The relative path to the document or folder starting at
     *  the workspace root.
     * @returns
     */
  createPath(workspaceHash, relativePath) {
    return this.getWorkspaceRootPath(workspaceHash) + relativePath;
  }

  /**
     * @param {*} workspaceHash The hash of a workspace.
     * @returns Returns the absolute path to the root folder of a workspace ending with '/'.
     */
  getWorkspaceRootPath(workspaceHash) {
    return `${this.paths.workspacesPath + workspaceHash}/${this.paths.workspaceRootFolderPath}`;
  }

  getFileStructurePath(workspaceHash) {
    return `${this.paths.workspacesPath + workspaceHash}/${this.paths.fileStructurePath}`;
  }

  getUserWorkspaces(userID) {
    const userPath = this.getUserPath(userID);
    const JSONString = fs.readFileSync(userPath);
    const userMeta = JSON.parse(JSONString);
    return userMeta.workspaces;
  }

  /**
     * @brief Returns the role of a user in a given workspace.
     * @note The role is a number specified in 'roles.js'.
     * @param {*} userID The ID of the user.
     * @param {*} workspaceHash The hash of the workspace.
     * @returns Returns the role number.
     */
  getUserWorkspaceRole(userID, workspaceHash) {
    const workspaces = this.getUserWorkspaces(userID);
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
     * @param {*} relativePath The relative workspace path of the document.
     * @returns Document content.
     */
  getDocumentData(workspaceHash, relativePath) {
    const data = fs.readFileSync(this.createPath(workspaceHash, relativePath), 'utf8');
    return data;
  }

  getFileStructureJSON(workspaceHash) {
    const raw = fs.readFileSync(this.getFileStructurePath(workspaceHash), 'utf8');
    return JSON.parse(raw);
  }

  /**
     * @brief Replaces the old file structure with a new one.
     * @param {*} workspaceHash The hash of the workspace of the file structure.
     * @param {*} JSONString The stringified file structure JSON data.
     */
  changeFileStructure(workspaceHash, JSONString) {
    fs.writeFileSync(this.getFileStructurePath(workspaceHash), JSONString);
  }

  /**
     * @brief Attempts to create a document.
     * @param {*} workspaceHash The hash of the workspace in which to create the document.
     * @param {*} docPath The path of the document.
     * @returns Returns whether the document was created successfully.
     */
  createDocument(workspaceHash, docPath) {
    const absolutePath = this.createPath(workspaceHash, docPath);
    try {
      fs.writeFileSync(absolutePath, '');
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
     * @param {*} folderPath The path of the folder.
     * @returns Returns whether the folder was created successfully.
     */
  /// TODO: always returns true
  createFolder(workspaceHash, folderPath) {
    const absolutePath = this.createPath(workspaceHash, folderPath);
    fs.mkdirSync(absolutePath);
    return true;
  }

  /// TODO: always returns true
  deleteDocument(workspaceHash, docPath) {
    const absolutePath = this.createPath(workspaceHash, docPath);
    fs.rmSync(absolutePath);
    return true;
  }

  /**
     * @brief Deletes a folder and all nested items.
     * @param {*} workspaceHash The hash of the workspace containing the folder.
     * @param {*} folderPath The relative path to the folder.
     * @returns Returns whether the folder was deleted successfully.
     */
  /// TODO: always returns true
  deleteFolder(workspaceHash, folderPath) {
    const absolutePath = this.createPath(workspaceHash, folderPath);
    fs.rmSync(absolutePath, { recursive: true });
    return true;
  }

  /// TODO: always returns true
  renameFile(workspaceHash, oldPath, newPath) {
    const absoluteOldPath = this.createPath(workspaceHash, oldPath);
    const absoluteNewPath = this.createPath(workspaceHash, newPath);

    fs.renameSync(absoluteOldPath, absoluteNewPath);
    return true;
  }

  writeDocumentData(workspaceHash, docPath, documentArray) {
    try {
      const absolutePath = this.createPath(workspaceHash, docPath);
      // erase file content and write first line
      fs.writeFileSync(absolutePath, documentArray[0]);
      // append the rest of lines
      for (let i = 1; i < documentArray.length; i++) {
        fs.appendFileSync(absolutePath, `\n${documentArray[i]}`);
      }
    }
    catch (err) {
      console.error(err);
    }
  }

  getUserPath(userID) {
    return `${this.paths.usersPath + userID}.json`;
  }

  addUserWorkspace(userID, workspaceHash, workspaceName, role) {
    const userPath = this.getUserPath(userID);
    const JSONString = fs.readFileSync(userPath);
    const userMeta = JSON.parse(JSONString);
    if (!userMeta.workspaces.some((workspace) => workspace.id === workspaceHash)) {
      userMeta.workspaces.push({
        id: workspaceHash,
        name: workspaceName,
        role,
      });
      fs.writeFileSync(userPath, JSON.stringify(userMeta));
    }
    else {
      console.log('DB Error: Adding already present workspace.');
    }
  }

  createWorkspace(ownerID, name) {
    try {
      const hash = this.sha256Hasher.update(name).digest('hex');

      const workspacePath = this.paths.workspacesPath + hash;
      // create workspace folder
      fs.mkdirSync(workspacePath);
      // create root folder
      fs.mkdirSync(this.getWorkspaceRootPath(hash));

      const defaultStructure = {
        nextID: 1,
        type: 1,
        ID: 0,
        name,
        items: {},
      };

      // create structure.json file
      fs.writeFileSync(this.getFileStructurePath(hash), JSON.stringify(defaultStructure));

      // add workspace entry to owner
      // this is added last so that all workspaces listed in user config are valid
      this.addUserWorkspace(ownerID, hash, name, roles.owner);

      return true;
    }
    catch (err) {
      console.error(err);
      return false;
    }
  }
}

module.exports = DatabaseGateway;
