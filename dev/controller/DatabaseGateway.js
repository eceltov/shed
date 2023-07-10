const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { roles } = require('./lib/roles');
const accessTypeHandler = require('./lib/workspaceAccessTypes');

class DatabaseGateway {
  constructor() {
    this.paths = null;
    this.configPath = path.join(__dirname, 'config.json');
    this.workspaceHashSalt = null;
    this.userHashSalt = null;
  }

  initialize() {
    const configString = fs.readFileSync(this.configPath);
    const config = JSON.parse(configString);
    this.paths = config.paths;
    this.paths.usersPath = path.join(__dirname, '../volumes/Data/users/');
    this.paths.workspacesPath = path.join(__dirname, '../volumes/Data/workspaces/');
    this.paths.usernameToIdMapPath = path.join(__dirname, '../volumes/Data/usernameToIdMap.json')
    this.workspaceHashSalt = config.workspaceHashSalt;
    this.userHashSalt = config.userHashSalt;
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

  getWorkspacePath(workspaceHash) {
    return this.paths.workspacesPath + workspaceHash;
  }

  /**
     * @param {*} workspaceHash The hash of a workspace.
     * @returns Returns the absolute path to the root folder of a workspace ending with '/'.
     */
  getWorkspaceRootPath(workspaceHash) {
    return `${this.getWorkspacePath(workspaceHash)}/${this.paths.workspaceRootFolderPath}`;
  }

  getFileStructurePath(workspaceHash) {
    return `${this.getWorkspacePath(workspaceHash)}/${this.paths.fileStructurePath}`;
  }

  getWorkspaceUsersPath(workspaceHash) {
    return `${this.getWorkspacePath(workspaceHash)}/${this.paths.workspaceUsersPath}`;
  }

  getWorkspaceConfigPath(workspaceHash) {
    return `${this.getWorkspacePath(workspaceHash)}/${this.paths.workspaceConfigPath}`;
  }

  getUserJson(userID) {
    try {
      const userPath = this.getUserPath(userID);
      const JSONString = fs.readFileSync(userPath);
      const userMeta = JSON.parse(JSONString);
      return userMeta;
    }
    catch (err) {
      console.error(err);
      return null;
    }
  }

  createUserJson(userID, username, password) {
    try {
      const userPath = this.getUserPath(userID);

      const userJson = {
        id: userID,
        role: 'user',
        username,
        password,
        workspaces: [],
      };

      fs.writeFileSync(userPath, JSON.stringify(userJson));

      return true;
    }
    catch (err) {
      console.error(err);
      return false;
    }
  }

  deleteUserJson(userID) {
    try {
      const userPath = this.getUserPath(userID);
      fs.rmSync(userPath);
      return true;
    }
    catch (err) {
      console.error(err);
      return false;
    }
  }

  changeUserPasswordByID(userID, newPassword) {
    try {
      const userPath = this.getUserPath(userID);
      const userJson = this.getUserJson(userID);
      userJson.password = newPassword;

      fs.writeFileSync(userPath, JSON.stringify(userJson));

      return true;
    }
    catch (err) {
      console.error(err);
      return false;
    }
  }

  getUserWorkspaces(userID) {
    const userMeta = this.getUserJson(userID);
    if (userMeta === null)
      return null;
    return userMeta.workspaces;
  }

  getUsernameToIdMap() {
    try {
      const mapPath = this.paths.usernameToIdMapPath;
      const JSONString = fs.readFileSync(mapPath);
      const parsed = JSON.parse(JSONString);
      return parsed;
    }
    catch (err) {
      console.error(err);
      return null;
    }
  }

  updateUsernameToIdMap(updatedMap) {
    try {
      const mapPath = this.paths.usernameToIdMapPath;
      fs.writeFileSync(mapPath, JSON.stringify(updatedMap));
      return true;
    }
    catch (err) {
      console.error(err);
      return false;
    }
  }

  /**
     * @brief Returns the role of a user in a given workspace.
     * @note The role is a number specified in 'roles.js'.
     * @param {*} userID The ID of the user.
     * @param {*} workspaceHash The hash of the workspace.
     * @returns Returns the role. If an inner exception occured, returns roles.none;
     */
  getUserWorkspaceRole(userID, workspaceHash) {
    const workspaces = this.getUserWorkspaces(userID);
    if (workspaces === null)
      return roles.none;
    
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
     * @brief Attempts to create a folder.
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

  removeUserWorkspace(userID, workspaceHash) {
    const userPath = this.getUserPath(userID);
    const JSONString = fs.readFileSync(userPath);
    const userMeta = JSON.parse(JSONString);
    const workspaceIdx = userMeta.workspaces.findIndex(
      (workspace) => workspace.id === workspaceHash,
    );

    if (workspaceIdx !== -1) {
      userMeta.workspaces.splice(workspaceIdx, 1);
      fs.writeFileSync(userPath, JSON.stringify(userMeta));
    }
  }

  workspaceExists(workspaceHash) {
    const workspacePath = this.paths.workspacesPath + workspaceHash;
    return fs.existsSync(workspacePath);
  }

  /**
   * @brief Creates a workspace for a given owner.
   * @param {*} ownerID The ID of the owner.
   * @param {*} name The name of the workspace.
   * @returns Return an object with the result of the operation: {successful, workspacePresent}
   */
  createWorkspace(ownerID, name) {
    const trimmedName = name.trim();
    try {
      const sha256Hasher = crypto.createHmac('sha256', this.workspaceHashSalt);
      const hash = sha256Hasher.update(trimmedName).digest('hex');

      if (this.workspaceExists(hash)) {
        return {
          successful: false,
          workspacePresent: true,
        };
      }

      const workspacePath = this.paths.workspacesPath + hash;
      // create workspace folder
      fs.mkdirSync(workspacePath);
      // create root folder
      fs.mkdirSync(this.getWorkspaceRootPath(hash));

      const defaultStructure = {
        nextID: 1,
        type: 1,
        ID: 0,
        name: trimmedName,
        items: {},
      };

      const defaultUsers = {
        [ownerID]: roles.owner,
      };

      const defaultConfig = {
        "access": accessTypeHandler.accessTypes.privileged,
      };

      // create structure.json file
      fs.writeFileSync(this.getFileStructurePath(hash), JSON.stringify(defaultStructure));

      // create users.json file
      fs.writeFileSync(this.getWorkspaceUsersPath(hash), JSON.stringify(defaultUsers));

      // create config.json file
      fs.writeFileSync(this.getWorkspaceConfigPath(hash), JSON.stringify(defaultConfig));

      // add workspace entry to owner
      // this is added last so that all workspaces listed in user config are valid
      this.addUserWorkspace(ownerID, hash, trimmedName, roles.owner);

      return {
        successful: true,
        workspacePresent: false,
      };
    }
    catch (err) {
      console.error(err);
      return {
        successful: false,
        workspacePresent: false,
      };
    }
  }

  deleteWorkspace(ownerID, workspaceHash) {
    try {
      const workspacePath = this.getWorkspacePath(workspaceHash);

      // get all user IDs
      const usersData = JSON.parse(fs.readFileSync(this.getWorkspaceUsersPath(workspaceHash), 'utf8'));
      const userIDs = Object.keys(usersData);

      if (!userIDs.includes(ownerID) || usersData[ownerID] !== roles.owner) {
        console.log(`Error in deleteWorkspace: User ${ownerID} with role ${usersData[ownerID]} attempted to delete the workspace ${workspaceHash}.`);
        return false;
      }

      // remove user entries
      userIDs.forEach((id) => this.removeUserWorkspace(id, workspaceHash));

      // remove workspace folder
      fs.rmSync(workspacePath, { recursive: true });

      return true;
    }
    catch (err) {
      console.error(err);
      return false;
    }
  }

  /**
   * @brief Adds a user to the UsernameToIDMap and creates a new JSON file for it.
   * @param {*} username The username of the new user.
   * @param {*} password The password of the new user.
   * @returns Returns an object indicating the result: {successful, userPresent}
   */
  addUser(username, password) {
    // check whether user already present
    const map = this.getUsernameToIdMap();
    if (map.hasOwnProperty(username)) {
      return {
        successful: false,
        userPresent: true,
      };
    }

    // create userHash
    const sha256Hasher = crypto.createHmac('sha256', this.userHashSalt);
    const userID = sha256Hasher.update(username).digest('hex');

    // create new user json
    map[username] = userID;
    if (!this.createUserJson(userID, username, password)) {
      return {
        successful: false,
        userPresent: false,
      };
    }

    // update map
    if (!this.updateUsernameToIdMap(map)) {
      this.deleteUserJson(userID);
      return {
        successful: false,
        userPresent: false,
      };
    }

    return {
      successful: true,
      userPresent: false,
    };
  }

  changeUserPassword(username, newPassword) {
    const map = this.getUsernameToIdMap();
    if (!map.hasOwnProperty(username)) {
      return false;
    }

    const userID = map[username];
    return this.changeUserPasswordByID(userID, newPassword);
  }

  removeUser(username) {
    const map = this.getUsernameToIdMap();
    if (!map.hasOwnProperty(username)) {
      return false;
    }

    const userID = map[username];
    delete map[username];

    if (!this.updateUsernameToIdMap(map)) {
      return false;
    }

    return this.deleteUserJson(userID);
  }

  verifyCredentials(username, password) {
    const map = this.getUsernameToIdMap();
    if (!map.hasOwnProperty(username)) {
      return { valid: false };
    }

    const userHash = map[username];
    const meta = this.getUserJson(userHash);
    if (meta === null)
      return { valid: false };
    if (meta.password === password) {
      return { valid: true, id: userHash, role: meta.role };
    }

    return { valid: false };
  }

  getWorkspaceConfig(workspaceHash) {
    try {
      const configPath = this.getWorkspaceConfigPath(workspaceHash);
      const JSONString = fs.readFileSync(configPath);
      const config = JSON.parse(JSONString);
      return config;
    }
    catch (err) {
      console.error(err);
      return null;
    }
  }

  /**
   * @param {*} workspaceHash The ID of the workspace.
   * @returns Returns the workspace access type if the configuration file exists, otherwise null.
   */
  getWorkspaceAccessType(workspaceHash) {
    const config = this.getWorkspaceConfig(workspaceHash);
    if (config === null)
      return null;
    return config.access;
  }

  workspaceExists(workspaceHash) {
    return fs.existsSync(this.getWorkspacePath(workspaceHash));
  }
}

module.exports = DatabaseGateway;
