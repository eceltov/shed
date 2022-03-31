const { msgTypes } = require('./messageTypes');

function createDocument(clientID, parentID, name) {
  return {
    msgType: msgTypes.client.createDocument,
    clientID,
    parentID,
    name,
  };
}

function createFolder(clientID, parentID, name) {
  return {
    msgType: msgTypes.client.createFolder,
    clientID,
    parentID,
    name,
  };
}

function deleteDocument(clientID, fileID) {
  return {
    msgType: msgTypes.client.deleteDocument,
    clientID,
    fileID,
  };
}

function deleteFolder(clientID, fileID) {
  return {
    msgType: msgTypes.client.deleteFolder,
    clientID,
    fileID,
  };
}

function renameFile(clientID, fileID, name) {
  return {
    msgType: msgTypes.client.renameFile,
    clientID,
    fileID,
    name,
  };
}

module.exports = {
  createDocument, createFolder, deleteDocument, deleteFolder, renameFile,
};
