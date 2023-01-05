/* eslint-disable object-property-newline */
const types = {
  document: 0,
  folder: 1,
};

const fileNameRegex = /^[^\\/:*?"<>|]*$/;

function validateFileName(name) {
  return fileNameRegex.test(name)
    && name !== '.'
    && name !== '..'
    && name !== '';
}

function getNewDocumentObj(fileID, name) {
  return {
    type: types.document,
    ID: fileID,
    name,
  };
}

function getNewFolderObj(fileID, name) {
  return {
    type: types.folder,
    ID: fileID,
    name,
    items: {},
  };
}

function getIDPathMapRecursion(folderObj, parentPath, map) {
  Object.values(folderObj.items).forEach((fileObj) => {
    const currentPath = parentPath + fileObj.ID.toString();
    map.set(fileObj.ID, currentPath);
    if (fileObj.type === types.folder) {
      const folderPath = `${currentPath}/`;
      getIDPathMapRecursion(fileObj, folderPath, map);
    }
  });
}

/**
 * @param {*} fileStructure The root of the file structure.
 * @returns Returns a Map from fileIDs to their paths.
 */
function getIDPathMap(fileStructure) {
  const map = new Map();
  const path = '';
  map.set(fileStructure.ID, path); // path to root
  getIDPathMapRecursion(fileStructure, path, map);
  return map;
}

function getFileObjectFromPath(fileStructure, path) {
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
}

/**
 * @param {*} fileStructure The root of the file structure.
 * @param {*} pathMap The map of fileIDs to filePaths.
 * @param {*} fileID The ID of the target file.
 * @returns Returns an object representing the file.
 */
function getFileObject(fileStructure, pathMap, fileID) {
  if (!pathMap.has(fileID)) {
    return null;
  }

  return getFileObjectFromPath(fileStructure, pathMap.get(fileID));
}

function getParentFileObject(fileStructure, pathMap, fileID) {
  if (!pathMap.has(fileID)) {
    return null;
  }

  // the parent of the root is the root
  if (fileID === 0) {
    return fileStructure;
  }

  const path = pathMap.get(fileID);

  const parentFolderEndIndex = path.lastIndexOf('/');
  if (parentFolderEndIndex === -1) {
    return fileStructure;
  }

  const parentPath = path.substring(0, parentFolderEndIndex);
  return getFileObjectFromPath(fileStructure, parentPath);
}

/**
 * @param {*} fileStructure The root of the file structure.
 * @param {*} path The path to a file that does not end with /
 * @returns Returns the name of a file based on its path.
 */
function getFileNameFromPath(fileStructure, path) {
  const file = getFileObjectFromPath(fileStructure, path);
  if (file === null) {
    return null;
  }
  return file.name;
}

function getFileNameFromID(fileStructure, pathMap, fileID) {
  if (!pathMap.has(fileID)) {
    return null;
  }
  const fileObj = getFileObject(fileStructure, pathMap, fileID);
  if (fileObj === null) {
    return null;
  }
  return fileObj.name;
}

function checkIfFolderHasFileName(folderObj, name) {
  let present = false;
  Object.values(folderObj.items).forEach((fileObj) => {
    if (fileObj.name === name) {
      present = true;
    }
  });
  return present;
}

/**
 * @brief Adds a new file to the file structure. Updates fileStructure and pathMap.
 * @param {*} fileStructure The root of the file structure.
 * @param {*} pathMap The map of fileIDs to filePaths.
 * @param {*} parentID The ID of the parent folder of the new file.
 * @param {*} fileObj The object of the new file.
 * @returns Returns true if successfull, else returns false.
 */
function addFile(fileStructure, pathMap, parentID, fileObj) {
  if (!pathMap.has(parentID)) {
    return false;
  }

  const parent = getFileObject(fileStructure, pathMap, parentID);
  if (
    parent.type !== types.folder
    || parent.items[fileObj.ID] !== undefined
    || checkIfFolderHasFileName(parent, fileObj.name)
  ) {
    return false;
  }

  parent.items[fileObj.ID] = fileObj;
  const filePath = (parentID === 0 ? '' : `${pathMap.get(parentID)}/`) + fileObj.ID;
  pathMap.set(fileObj.ID, filePath);

  return true;
}

/**
 * @brief Recursively removes paths from pathMap of nested files in folderObj.
 * @param {*} pathMap The map of fileIDs to filePaths.
 * @param {*} folderObj A fileStructure object representing a folder.
 */
function removeFileRecursion(pathMap, folderObj) {
  Object.values(folderObj.items).forEach((item) => {
    if (item.type === types.folder) {
      removeFileRecursion(pathMap, item);
    }
    pathMap.delete(item.ID);
  });
}

/**
 * @brief Removes a file from the fileStructure. Updates fileStructure and pathMap.
 * @note If the file is a folder, also deletes all nested files.
 * @param {*} fileStructure The root of the file structure.
 * @param {*} pathMap The map of fileIDs to filePaths.
 * @param {*} fileID The ID of the file to be deleted.
 * @returns Returns whether the deletion was successful.
 */
function removeFile(fileStructure, pathMap, fileID) {
  if (fileID === 0 || !pathMap.has(fileID)) {
    return false;
  }

  const parentFolderObj = getParentFileObject(fileStructure, pathMap, fileID);

  // it is safe to index into items of the parent folder, because fileID !== parentID
  //    due to fileID !== 0 and the root folder being the only folder with it as its parent
  const fileObj = parentFolderObj.items[fileID];

  if (fileObj.type === types.folder) {
    removeFileRecursion(pathMap, fileObj);
  }

  pathMap.delete(fileID);
  delete parentFolderObj.items[fileID];
  return true;
}

function renameFile(fileStructure, pathMap, fileID, newName) {
  if (fileID === 0 || !pathMap.has(fileID)) {
    return false;
  }

  const parentFolder = getParentFileObject(fileStructure, pathMap, fileID);
  if (checkIfFolderHasFileName(parentFolder, newName)) {
    return false;
  }

  // it is safe to index into items of the parent folder, because fileID !== parentID
  //    due to fileID !== 0 and the root folder being the only folder with it as its parent
  const fileObj = parentFolder.items[fileID];
  fileObj.name = newName;
  return true;
}

function isDocument(fileStructure, pathMap, fileID) {
  const path = pathMap.get(fileID);

  if (path === undefined) {
    return false;
  }

  const documentObj = getFileObjectFromPath(fileStructure, path);
  if (documentObj === null) {
    console.log('DocumentObj === null, path:', path);
    return false;
  }
  if (documentObj.type !== types.document) {
    return false;
  }

  return true;
}

function getAbsolutePathFromIDPath(fileStructure, path) {
  if (typeof path !== 'string') {
    console.log('Absolute path is null!');
    return null;
  }
  let absolutePath = '';
  const tokens = path.split('/');

  let obj = fileStructure;
  for (let i = 0; i < tokens.length - 1; i++) {
    obj = obj.items[tokens[i]];
    if (obj === undefined || obj.type !== types.folder) {
      return null;
    }
    absolutePath += `${obj.name}/`;
  }
  obj = obj.items[tokens[tokens.length - 1]];
  if (obj === undefined) {
    return null;
  }
  return absolutePath + obj.name;
}

/**
 * @param {*} fileStructure The root of the file structure.
 * @param {*} pathMap The map of fileIDs to filePaths.
 * @param {*} fileID An ID of a document or folder.
 * @returns Returns fileID if it points to a folder, else returns the ID of its parent.
 */
function getSpawnParentID(fileStructure, pathMap, fileID) {
  const parentFolderObj = getParentFileObject(
    fileStructure, pathMap, fileID,
  );
  const fileObj = getFileObject(
    fileStructure, pathMap, fileID,
  );

  if (fileObj.type !== types.folder) {
    return parentFolderObj.ID;
  }
  return fileObj.ID;
}

module.exports = {
  types, validateFileName, getNewDocumentObj, getNewFolderObj, getIDPathMap, getFileObjectFromPath,
  getFileObject, getParentFileObject, getFileNameFromPath, getFileNameFromID,
  checkIfFolderHasFileName, addFile, removeFile, renameFile, isDocument, getAbsolutePathFromIDPath,
  getSpawnParentID,
};
