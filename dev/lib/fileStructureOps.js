if (typeof fsOps === 'undefined') {
    // Export for browsers
    var fsOps = {};
    fsOps.types = {};
}

fsOps.types.document = 0;
fsOps.types.folder = 1;

fsOps.getNewDocumentObj = function(fileID) {
    return {
        type: fsOps.types.document,
        ID: fileID
    };
}

fsOps.getNewFolderObj = function(fileID) {
    return {
        type: fsOps.types.folder,
        ID: fileID,
        items: {}
    };
}

/**
 * @param {*} fileStructure The root of the file structure.
 * @returns Returns a Map from fileIDs to their paths.
 */
fsOps.getIDPathMap = function(fileStructure) {
    const map = new Map();
    const path = "";
    fsOps._getIDPathMapRecursion(fileStructure, path, map);
    return map;
}

fsOps._getIDPathMapRecursion = function(folderObj, parentPath, map) {
    Object.entries(folderObj.items).forEach((keyValuePair) => {
        const name = keyValuePair[0];
        const fileObj = keyValuePair[1];
        const currentPath = parentPath + name;
        map.set(fileObj.ID, currentPath);
        if (fileObj.type === fsOps.types.folder) {
            const folderPath = currentPath + "/";
            fsOps._getIDPathMapRecursion(fileObj, folderPath, map);
        }
    });
}

fsOps.getFileObjectFromPath = function(fileStructure, path) {
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
fsOps.getFileObject = function(fileStructure, pathMap, fileID) {
    if (!pathMap.has(fileID)) {
        return null;
    }

    return fsOps.getFileObjectFromPath(fileStructure, pathMap.get(fileID));
}

fsOps.getParentFileObject = function(fileStructure, pathMap, fileID) {
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
}

/**
 * @param {*} path The path to a file that does not end with /
 * @returns Returns the name of a file based on its path.
 */
fsOps.getFileNameFromPath = function(path) {
    const parentFolderEndIndex = path.lastIndexOf('/');
    if (parentFolderEndIndex === -1) {
        return path;
    }
    else {
        return path.substring(parentFolderEndIndex + 1);
    }
}

/**
 * @brief Adds a new file to the file structure. Updates fileStructure and pathMap.
 * @param {*} fileStructure The root of the file structure.
 * @param {*} pathMap The map of fileIDs to filePaths.
 * @param {*} parentID The ID of the parent folder of the new file.
 * @param {*} fileName The name of the new file.
 * @param {*} fileObj The object of the new file.
 * @returns Returns true if successfull, else returns false.
 */
fsOps.addFile = function(fileStructure, pathMap, parentID, fileName, fileObj) {
    if (!pathMap.has(parentID)) {
        return false;
    }

    const parent = fsOps.getFileObject(fileStructure, pathMap, parentID);
    if (parent.type !== fsOps.types.folder || parent.items[fileName] !== undefined) {
        return false;
    }

    parent.items[fileName] = fileObj;
    const filePath = (parentID === 0 ? "" : pathMap.get(parentID) + "/") + fileName;
    pathMap.set(fileObj.ID, filePath);

    return true;
}

/**
 * @brief Removes a file from the fileStructure. Updates fileStructure and pathMap.
 * @note If the file is a folder, also deletes all nested files.
 * @param {*} fileStructure The root of the file structure.
 * @param {*} pathMap The map of fileIDs to filePaths.
 * @param {*} fileID The ID of the file to be deleted.
 * @returns Returns whether the deletion was successfull.
 */
fsOps.removeFile = function(fileStructure, pathMap, fileID) {
    if (fileID === 0 || !pathMap.has(fileID)) {
        return false;
    }

    const parentFolder = fsOps.getParentFileObject(fileStructure, pathMap, fileID);
    const fileName = fsOps.getFileNameFromPath(pathMap.get(fileID));
    const file = parentFolder.items[fileName];

    // remove all nested files from pathMap
    if (file.type === fsOps.types.folder) {
        fsOps._removeFileRecursion(pathMap, file.items);
    }

    pathMap.delete(file.ID);
    delete parentFolder.items[fileName];
    return true;
}

/**
 * @brief Recursively removes paths from pathMap of nested files in folderObj.
 * @param {*} pathMap The map of fileIDs to filePaths.
 * @param {*} folderObj A fileStructure object representing a folder.
 */
fsOps._removeFileRecursion = function(pathMap, folderObj) {
    for (let item of folderObj.items) {
        if (item.type === fsOps.types.folder) {
            fsOps.recursivePathDelete(pathMap, item);
        }
        pathMap.delete(item.ID);
    }
}

fsOps.renameFile = function(fileStructure, pathMap, fileID, newName) {
    if (fileID === 0 || !pathMap.has(fileID)) {
        return false;
    }

    const parentFolder = fsOps.getParentFileObject(fileStructure, pathMap, fileID);

    if (parentFolder.items[newName] !== undefined) {
        return false;
    }

    const oldName = fsOps.getFileNameFromPath(pathMap.get(fileID));
    parentFolder.items[newName] = parentFolder.items[oldName];
    delete parentFolder.items[oldName];

    const newPath = parentFolder.ID === 0 ? newName : pathMap.get(parentFolder.ID) + "/" + newName;
    pathMap.set(fileID, newPath);
}

fsOps.isDocument = function(fileStructure, pathMap, fileID) {
    const path = pathMap.get(fileID);

    if (path === undefined) {
        return false;
    }

    const documentObj = fsOps.getFileObjectFromPath(fileStructure, path);
    if (documentObj.type !== fsOps.types.document) {
        return false;
    }

    return true;
}



module.exports = fsOps;
