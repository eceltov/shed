const msgTypes = require('./messageTypes');

const msgFactory = {};

msgFactory.initialize = function initialize() {

};

/**
 * @param {*} fileStructureItems The fileStructure.items property.
 * @param {*} role The role of the client.
 */
msgFactory.initWorkspace = function initWorkspace(clientID, fileStructureItems, role) {
  return {
    msgType: msgTypes.server.initWorkspace,
    clientID,
    fileStructure: fileStructureItems,
    role,
  };
};

msgFactory.initDocument = function initDocument(
  serverDocument, fileID, serverHB, serverOrdering, firstSOMessageNumber,
) {
  return {
    msgType: msgTypes.server.initDocument,
    serverDocument,
    fileID,
    serverHB,
    serverOrdering,
    firstSOMessageNumber,
  };
};

msgFactory.GCMetadataRequest = function GCMetadataRequest(fileID) {
  return {
    msgType: msgTypes.server.GCMetadataRequest,
    fileID,
  };
};

msgFactory.GC = function GC(fileID, GCOldestMessageNumber) {
  return {
    msgType: msgTypes.server.GC,
    fileID,
    GCOldestMessageNumber,
  };
};

msgFactory.createDocument = function createDocument(parentID, fileID, name) {
  return {
    msgType: msgTypes.server.createDocument,
    parentID,
    fileID,
    name,
  };
};

msgFactory.createFolder = function createFolder(parentID, fileID, name) {
  return {
    msgType: msgTypes.server.createFolder,
    parentID,
    fileID,
    name,
  };
};

msgFactory.deleteDocument = function deleteDocument(fileID) {
  return {
    msgType: msgTypes.server.deleteDocument,
    fileID,
  };
};

msgFactory.deleteFolder = function deleteFolder(fileID) {
  return {
    msgType: msgTypes.server.deleteFolder,
    fileID,
  };
};

msgFactory.renameFile = function renameFile(fileID, name) {
  return {
    msgType: msgTypes.server.renameFile,
    fileID,
    name,
  };
};

module.exports = msgFactory;
