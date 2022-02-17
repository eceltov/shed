const fsOps = {};
fsOps.types = {};

fsOps.types.document = 0;
fsOps.types.folder = 1;

fsOps.fileNameRegex = /^[^\\/:*?"<>|]*$/;

fsOps.validateFileName = function validateFileName(name) {
  return fsOps.fileNameRegex.test(name) && name !== '.' && name !== '..';
};

fsOps.getNewDocumentObj = function getNewDocumentObj(fileID, name) {
  return {
    type: fsOps.types.document,
    ID: fileID,
    name,
  };
};

fsOps.getNewFolderObj = function getNewFolderObj(fileID, name) {
  return {
    type: fsOps.types.folder,
    ID: fileID,
    name,
    items: {},
  };
};

/**
 * @param {*} fileStructure The root of the file structure.
 * @returns Returns a Map from fileIDs to their paths.
 */
fsOps.getIDPathMap = function getIDPathMap(fileStructure) {
  const map = new Map();
  const path = '';
  map.set(fileStructure.ID, path); // path to root
  fsOps.getIDPathMapRecursion(fileStructure, path, map);
  return map;
};

fsOps.getIDPathMapRecursion = function getIDPathMapRecursion(folderObj, parentPath, map) {
  Object.values(folderObj.items).forEach((fileObj) => {
    const currentPath = parentPath + fileObj.ID.toString();
    map.set(fileObj.ID, currentPath);
    if (fileObj.type === fsOps.types.folder) {
      const folderPath = `${currentPath}/`;
      fsOps.getIDPathMapRecursion(fileObj, folderPath, map);
    }
  });
};

fsOps.getFileObjectFromPath = function getFileObjectFromPath(fileStructure, path) {
  if (typeof path !== 'string') {
    console.log('Absolute path is null!');
    return null;
  }
  if (path === '') {
    return fileStructure;
  }

  const tokens = path.split('/');
  let obj = fileStructure;
  for (let i = 0; i < tokens.length; i++) {
    obj = obj.items[tokens[i]];
    if (obj === undefined) {
      return null;
    }
  }
  return obj;
};

/**
 * @param {*} fileStructure The root of the file structure.
 * @param {*} pathMap The map of fileIDs to filePaths.
 * @param {*} fileID The ID of the target file.
 * @returns Returns an object representing the file.
 */
fsOps.getFileObject = function getFileObject(fileStructure, pathMap, fileID) {
  if (!pathMap.has(fileID)) {
    return null;
  }

  return fsOps.getFileObjectFromPath(fileStructure, pathMap.get(fileID));
};

fsOps.getParentFileObject = function getParentFileObject(fileStructure, pathMap, fileID) {
  if (!pathMap.has(fileID)) {
    return null;
  }

  const path = pathMap.get(fileID);

  const parentFolderEndIndex = path.lastIndexOf('/');
  if (parentFolderEndIndex === -1) {
    return fileStructure;
  }

  const parentPath = path.substring(0, parentFolderEndIndex);
  return fsOps.getFileObjectFromPath(fileStructure, parentPath);
};

/**
 * @param {*} fileStructure The root of the file structure.
 * @param {*} path The path to a file that does not end with /
 * @returns Returns the name of a file based on its path.
 */
fsOps.getFileNameFromPath = function getFileNameFromPath(fileStructure, path) {
  const file = fsOps.getFileObjectFromPath(fileStructure, path);
  if (file === null) {
    return null;
  }
  return file.name;
};

fsOps.getFileNameFromID = function getFileNameFromID(fileStructure, pathMap, fileID) {
  if (!pathMap.has(fileID)) {
    return null;
  }
  const fileObj = fsOps.getFileObject(fileStructure, pathMap, fileID);
  if (fileObj === null) {
    return null;
  }
  return fileObj.name;
};

fsOps.checkIfFolderHasFileName = function checkIfFolderHasFileName(folderObj, name) {
  let present = false;
  Object.values(folderObj.items).forEach((fileObj) => {
    if (fileObj.name === name) {
      present = true;
    }
  });
  return present;
};

/**
 * @brief Adds a new file to the file structure. Updates fileStructure and pathMap.
 * @param {*} fileStructure The root of the file structure.
 * @param {*} pathMap The map of fileIDs to filePaths.
 * @param {*} parentID The ID of the parent folder of the new file.
 * @param {*} fileObj The object of the new file.
 * @returns Returns true if successfull, else returns false.
 */
fsOps.addFile = function addFile(fileStructure, pathMap, parentID, fileObj) {
  if (!pathMap.has(parentID)) {
    return false;
  }

  const parent = fsOps.getFileObject(fileStructure, pathMap, parentID);
  if (
    parent.type !== fsOps.types.folder
    || parent.items[fileObj.ID] !== undefined
    || fsOps.checkIfFolderHasFileName(parent, fileObj.name)
  ) {
    return false;
  }

  parent.items[fileObj.ID] = fileObj;
  const filePath = (parentID === 0 ? '' : `${pathMap.get(parentID)}/`) + fileObj.ID;
  pathMap.set(fileObj.ID, filePath);

  return true;
};

/**
 * @brief Removes a file from the fileStructure. Updates fileStructure and pathMap.
 * @note If the file is a folder, also deletes all nested files.
 * @param {*} fileStructure The root of the file structure.
 * @param {*} pathMap The map of fileIDs to filePaths.
 * @param {*} fileID The ID of the file to be deleted.
 * @returns Returns whether the deletion was successfull.
 */
fsOps.removeFile = function removeFile(fileStructure, pathMap, fileID) {
  if (fileID === 0 || !pathMap.has(fileID)) {
    return false;
  }

  const parentFolderObj = fsOps.getParentFileObject(fileStructure, pathMap, fileID);
  const fileObj = parentFolderObj.items[fileID];

  if (fileObj.type === fsOps.types.folder) {
    fsOps.removeFileRecursion(pathMap, fileObj);
  }

  pathMap.delete(fileID);
  delete parentFolderObj.items[fileID];
  return true;
};

/**
 * @brief Recursively removes paths from pathMap of nested files in folderObj.
 * @param {*} pathMap The map of fileIDs to filePaths.
 * @param {*} folderObj A fileStructure object representing a folder.
 */
fsOps.removeFileRecursion = function removeFileRecursion(pathMap, folderObj) {
  Object.values(folderObj.items).forEach((item) => {
    if (item.type === fsOps.types.folder) {
      fsOps.removeFileRecursion(pathMap, item);
    }
    pathMap.delete(item.ID);
  });
};

fsOps.renameFile = function renameFile(fileStructure, pathMap, fileID, newName) {
  if (fileID === 0 || !pathMap.has(fileID)) {
    return false;
  }

  const parentFolder = fsOps.getParentFileObject(fileStructure, pathMap, fileID);
  if (fsOps.checkIfFolderHasFileName(parentFolder, newName)) {
    return false;
  }

  const fileObj = parentFolder.items[fileID];
  fileObj.name = newName;
  return true;
};

fsOps.isDocument = function isDocument(fileStructure, pathMap, fileID) {
  const path = pathMap.get(fileID);

  if (path === undefined) {
    return false;
  }

  const documentObj = fsOps.getFileObjectFromPath(fileStructure, path);
  if (documentObj === null) {
    console.log('DocumentObj === null, path:', path);
    return false;
  }
  if (documentObj.type !== fsOps.types.document) {
    return false;
  }

  return true;
};

fsOps.getAbsolutePathFromIDPath = function getAbsolutePathFromIDPath(fileStructure, path) {
  if (typeof path !== 'string') {
    console.log('Absolute path is null!');
    return null;
  }
  let absolutePath = '';
  const tokens = path.split('/');

  let obj = fileStructure;
  for (let i = 0; i < tokens.length - 1; i++) {
    obj = obj.items[tokens[i]];
    if (obj === undefined || obj.type !== fsOps.types.folder) {
      return null;
    }
    absolutePath += `${obj.name}/`;
  }
  obj = obj.items[tokens[tokens.length - 1]];
  if (obj === undefined) {
    return null;
  }
  return absolutePath + obj.name;
};

module.exports = fsOps;