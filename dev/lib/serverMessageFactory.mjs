import msgTypes from './messageTypes.mjs';

export function initialize() {

}

/**
 * @param {*} fileStructureItems The fileStructure.items property.
 * @param {*} role The role of the client.
 */
export function initWorkspace(clientID, fileStructureItems, role) {
  return {
    msgType: msgTypes.server.initWorkspace,
    clientID,
    fileStructure: fileStructureItems,
    role,
  };
}

export function initDocument(
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

export function GCMetadataRequest(fileID) {
  return {
    msgType: msgTypes.server.GCMetadataRequest,
    fileID,
  };
}

export function GC(fileID, GCOldestMessageNumber) {
  return {
    msgType: msgTypes.server.GC,
    fileID,
    GCOldestMessageNumber,
  };
}

export function createDocument(parentID, fileID, name) {
  return {
    msgType: msgTypes.server.createDocument,
    parentID,
    fileID,
    name,
  };
}

export function createFolder(parentID, fileID, name) {
  return {
    msgType: msgTypes.server.createFolder,
    parentID,
    fileID,
    name,
  };
}

export function deleteDocument(fileID) {
  return {
    msgType: msgTypes.server.deleteDocument,
    fileID,
  };
}

export function deleteFolder(fileID) {
  return {
    msgType: msgTypes.server.deleteFolder,
    fileID,
  };
}

export function renameFile(fileID, name) {
  return {
    msgType: msgTypes.server.renameFile,
    fileID,
    name,
  };
}
