if (typeof com === 'undefined') {
    // Export for browsers
    var com = {};
    com.msgTypes = {};
    com.clientMsg = {};
    com.serverMsg = {};
}

///TODO: remove these from all source files
com.msgTypes.initialize = 1; // sent by server to client alongside necessary data to initialize the client workspace
com.msgTypes.getDocument = 2; // sent by client to get the initial document state
com.msgTypes.sentDocument = 3; // send by server alongside the initial document state
com.msgTypes.GCMetadataRequest = 4; // sent by server to start the GC process
com.msgTypes.GCMetadataResponse = 5; // sent by client with metadata used in the GC process
com.msgTypes.GC = 6; // send by server, a command to collect garbage

// messages sent by clients
com.clientMsg.connect = 0; // sent after connecting alongside desired workspace hash and authentication data
com.clientMsg.getDocument = 1; // sent to get the initial document state
com.clientMsg.GCMetadataResponse = 2; // sent with metadata used in the GC process
com.clientMsg.createDocument = 3; // sent to create a new document: {msgType, parentID, name}
com.clientMsg.createFolder = 4; // sent to create a new folder: {msgType, parentID, name}
com.clientMsg.deleteDocument = 5; // sent to delete a document: {msgType, fileID}
com.clientMsg.deleteFolder = 6; // sent to delete a folder: {msgType, fileID}
com.clientMsg.renameFile = 7; // send to rename a file: {msgType, fileID, name}

// messages sent by server
com.serverMsg.initialize = 51; // sent alongside necessary data to initialize the client workspace
com.serverMsg.initDocument = 52; // send the initial document state
com.serverMsg.initWorkspace = 53; // sent alongside the folder structure of the workspace
com.serverMsg.GCMetadataRequest = 54; // sent to start the GC process
com.serverMsg.GC = 55; // a command to collect garbage
com.serverMsg.createDocument = 56; // sent after document creation: {msgType, parentID, fileID, name}
com.serverMsg.createFolder = 57; // sent after folder creation: {msgType, parentID, fileID, name}
com.serverMsg.deleteDocument = 58; // sent after document deletion: {msgType, fileID}
com.serverMsg.deleteFolder = 59; // sent after folder deletion, no messages are sent for nested files: {msgType, fileID}
com.serverMsg.renameFile = 60; // sent after file renaming: {msgType, fileID, name}

module.exports = com;
