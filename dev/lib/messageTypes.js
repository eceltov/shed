if (typeof msgTypes === 'undefined') {
    // Export for browsers
    var msgTypes = {};
    msgTypes.client = {};
    msgTypes.server = {};
}

// messages sent by clients
msgTypes.client.connect = 0; // sent after connecting alongside desired workspace hash and authentication data
msgTypes.client.getDocument = 1; // sent to get the initial document state
msgTypes.client.GCMetadataResponse = 2; // sent with metadata used in the GC process
msgTypes.client.createDocument = 3; // sent to create a new document: {msgType, parentID, name}
msgTypes.client.createFolder = 4; // sent to create a new folder: {msgType, parentID, name}
msgTypes.client.deleteDocument = 5; // sent to delete a document: {msgType, fileID}
msgTypes.client.deleteFolder = 6; // sent to delete a folder: {msgType, fileID}
msgTypes.client.renameFile = 7; // send to rename a file: {msgType, fileID, name}

// messages sent by server
msgTypes.server.initialize = 51; // sent alongside necessary data to initialize the client workspace
msgTypes.server.initWorkspace = 52; // sent alongside the folder structure of the workspace
msgTypes.server.initDocument = 53; // send the initial document state
msgTypes.server.GCMetadataRequest = 54; // sent to start the GC process
msgTypes.server.GC = 55; // a command to collect garbage
msgTypes.server.createDocument = 56; // sent after document creation: {msgType, parentID, fileID, name}
msgTypes.server.createFolder = 57; // sent after folder creation: {msgType, parentID, fileID, name}
msgTypes.server.deleteDocument = 58; // sent after document deletion: {msgType, fileID}
msgTypes.server.deleteFolder = 59; // sent after folder deletion, no messages are sent for nested files: {msgType, fileID}
msgTypes.server.renameFile = 60; // sent after file renaming: {msgType, fileID, name}

module.exports = msgTypes;
