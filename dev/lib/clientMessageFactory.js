// Export for browsers
const msgFactory = {};

msgFactory.createDocument = function createDocument(clientID, parentID, name) {
  return {
    msgType: msgTypes.client.createDocument,
    clientID,
    parentID,
    name,
  };
};

msgFactory.createFolder = function createFolder(clientID, parentID, name) {
  return {
    msgType: msgTypes.client.createFolder,
    clientID,
    parentID,
    name,
  };
};

msgFactory.deleteDocument = function deleteDocument(clientID, fileID) {
  return {
    msgType: msgTypes.client.deleteDocument,
    clientID,
    fileID,
  };
};

msgFactory.deleteFolder = function deleteFolder(clientID, fileID) {
  return {
    msgType: msgTypes.client.deleteFolder,
    clientID,
    fileID,
  };
};

msgFactory.renameFile = function renameFile(clientID, fileID, name) {
  return {
    msgType: msgTypes.client.renameFile,
    clientID,
    fileID,
    name,
  };
};
