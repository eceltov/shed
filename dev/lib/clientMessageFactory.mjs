import msgTypes from './messageTypes.mjs';

export function createDocument(clientID, parentID, name) {
  return {
    msgType: msgTypes.client.createDocument,
    clientID,
    parentID,
    name,
  };
}

export function createFolder(clientID, parentID, name) {
  return {
    msgType: msgTypes.client.createFolder,
    clientID,
    parentID,
    name,
  };
}

export function deleteDocument(clientID, fileID) {
  return {
    msgType: msgTypes.client.deleteDocument,
    clientID,
    fileID,
  };
}

export function deleteFolder(clientID, fileID) {
  return {
    msgType: msgTypes.client.deleteFolder,
    clientID,
    fileID,
  };
}

export function renameFile(clientID, fileID, name) {
  return {
    msgType: msgTypes.client.renameFile,
    clientID,
    fileID,
    name,
  };
}
