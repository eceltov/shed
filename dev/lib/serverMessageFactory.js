var msgTypes = require('./messageTypes');

var msgFactory = {};

msgFactory.initialize = function() {

}

/**
 * @param {*} fileStructureItems The fileStructure.items property.
 * @param {*} role The role of the client.
 */
msgFactory.initWorkspace = function(fileStructureItems, role) {
    return {
        msgType: msgTypes.server.initWorkspace,
        fileStructure: fileStructureItems,
        role: role
    };
}

msgFactory.initDocument = function(clientID, serverDocument, serverHB, serverOrdering, firstSOMessageNumber) {
    return {
        msgType: msgTypes.server.initDocument,
        clientID: clientID,
        serverDocument: serverDocument,
        serverHB: serverHB,
        serverOrdering: serverOrdering,
        firstSOMessageNumber: firstSOMessageNumber,
    };
}

msgFactory.GCMetadataRequest = function() {
    return { 
        msgType: msgTypes.server.GCMetadataRequest
    };
}

msgFactory.GC = function(GCOldestMessageNumber) {
    return {
        msgType: msgTypes.server.GC,
        GCOldestMessageNumber: GCOldestMessageNumber
    };
}

msgFactory.createDocument = function(parentID, fileID, name) {
    return {
        msgType: msgTypes.server.createDocument,
        parentID: parentID,
        fileID: fileID,
        name: name
    };
}

msgFactory.createFolder = function(parentID, fileID, name) {
    return {
        msgType: msgTypes.server.createFolder,
        parentID: parentID,
        fileID: fileID,
        name: name
    };
}

msgFactory.deleteDocument = function(fileID) {
    return {
        msgType: msgTypes.server.deleteDocument,
        fileID: fileID
    };
}

msgFactory.deleteFolder = function(fileID) {
    return {
        msgType: msgTypes.server.deleteFolder,
        fileID: fileID,
    };
}

msgFactory.renameFile = function(fileID, name) {
    return {
        msgType: msgTypes.server.renameFile,
        fileID: fileID,
        name: name
    };
}


module.exports = msgFactory;
