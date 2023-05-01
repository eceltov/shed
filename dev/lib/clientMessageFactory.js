const { msgTypes } = require('./messageTypes');

function getDocument(fileID) {
  return {
    msgType: msgTypes.client.getDocument,
    fileID,
  };
}

function createDocument(parentID, name) {
  return {
    msgType: msgTypes.client.createDocument,
    parentID,
    name,
  };
}

function createFolder(parentID, name) {
  return {
    msgType: msgTypes.client.createFolder,
    parentID,
    name,
  };
}

function deleteDocument(fileID) {
  return {
    msgType: msgTypes.client.deleteDocument,
    fileID,
  };
}

function deleteFolder(fileID) {
  return {
    msgType: msgTypes.client.deleteFolder,
    fileID,
  };
}

function renameFile(fileID, name) {
  return {
    msgType: msgTypes.client.renameFile,
    fileID,
    name,
  };
}

function deleteWorkspace() {
  return {
    msgType: msgTypes.client.deleteWorkspace,
  };
}

function forceDocument(fileID, document) {
  return {
    msgType: msgTypes.client.forceDocument,
    fileID,
    document,
  };
}

function addUserToWorkspace(username, role) {
  return {
    msgType: msgTypes.client.addUserToWorkspace,
    username,
    role,
  };
}

module.exports = {
  createDocument, createFolder, deleteDocument, deleteFolder, renameFile, deleteWorkspace,
  getDocument, forceDocument, addUserToWorkspace,
};
