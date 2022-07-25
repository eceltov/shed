/* eslint-disable object-property-newline */
const { msgTypes } = require('./messageTypes');

function initialize() {

}

/**
 * @param {*} fileStructureItems The fileStructure.items property.
 * @param {*} role The role of the client.
 */
function initWorkspace(clientID, fileStructureItems, role) {
  return {
    msgType: msgTypes.server.initWorkspace,
    clientID,
    fileStructure: fileStructureItems,
    role,
  };
}

function initDocument(
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
}

function GCMetadataRequest(fileID) {
  return {
    msgType: msgTypes.server.GCMetadataRequest,
    fileID,
  };
}

function GC(fileID, GCOldestMessageNumber) {
  return {
    msgType: msgTypes.server.GC,
    fileID,
    GCOldestMessageNumber,
  };
}

function createDocument(parentID, fileID, name) {
  return {
    msgType: msgTypes.server.createDocument,
    parentID,
    fileID,
    name,
  };
}

function createFolder(parentID, fileID, name) {
  return {
    msgType: msgTypes.server.createFolder,
    parentID,
    fileID,
    name,
  };
}

function deleteDocument(fileID) {
  return {
    msgType: msgTypes.server.deleteDocument,
    fileID,
  };
}

function deleteFolder(fileID) {
  return {
    msgType: msgTypes.server.deleteFolder,
    fileID,
  };
}

function renameFile(fileID, name) {
  return {
    msgType: msgTypes.server.renameFile,
    fileID,
    name,
  };
}

function failedValidation() {
  return {
    msgType: msgTypes.server.failedValidation,
  };
}

function deleteWorkspace() {
  return {
    msgType: msgTypes.server.deleteWorkspace,
  };
}

module.exports = {
  initialize, initWorkspace, initDocument, GCMetadataRequest, GC, createDocument,
  createFolder, deleteDocument, deleteFolder, renameFile, failedValidation, deleteWorkspace,
};
