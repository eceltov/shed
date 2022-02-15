if (typeof msgFactory === 'undefined') {
    // Export for browsers
    var msgFactory = {};
}

msgFactory.createDocument = function(clientID, parentID, name) {
    return {
        msgType: msgTypes.client.createDocument,
        clientID: clientID,
        parentID: parentID,
        name: name
    };
}

msgFactory.createFolder = function(clientID, parentID, name) {
    return {
        msgType: msgTypes.client.createFolder,
        clientID: clientID,
        parentID: parentID,
        name: name
    };
}

msgFactory.deleteDocument = function(clientID, fileID) {
    return {
        msgType: msgTypes.client.deleteDocument,
        clientID: clientID,
        fileID: fileID
    };
}

msgFactory.deleteFolder = function(clientID, fileID) {
    return {
        msgType: msgTypes.client.deleteFolder,
        clientID: clientID,
        fileID: fileID
    };
}

msgFactory.renameFile = function(clientID, fileID, name) {
    return {
        msgType: msgTypes.client.renameFile,
        clientID: clientID,
        fileID: fileID,
        name: name
    };
}