const msgTypes = {};
msgTypes.client = {};
msgTypes.server = {};

// messages sent by clients

// sent after connecting alongside desired workspace hash and authentication data
msgTypes.client.connect = 0;
// sent to get the initial document state
msgTypes.client.getDocument = 1;
// sent with metadata used in the GC process
msgTypes.client.GCMetadataResponse = 2;
// sent to create a new document: {msgType, parentID, name}
msgTypes.client.createDocument = 3;
// sent to create a new folder: {msgType, parentID, name}
msgTypes.client.createFolder = 4;
// sent to delete a document: {msgType, fileID}
msgTypes.client.deleteDocument = 5;
// sent to delete a folder: {msgType, fileID}
msgTypes.client.deleteFolder = 6;
// sent to rename a file: {msgType, fileID, name}
msgTypes.client.renameFile = 7;
// sent to stop receiving operations from that document: {msgType, fileID}
msgTypes.client.closeDocument = 8;

// messages sent by server

// sent alongside necessary data to initialize the client workspace
msgTypes.server.initialize = 51;
// sent alongside the folder structure of the workspace
msgTypes.server.initWorkspace = 52;
// send the initial document state
msgTypes.server.initDocument = 53;
// sent to start the GC process
msgTypes.server.GCMetadataRequest = 54;
// a command to collect garbage
msgTypes.server.GC = 55;
// sent after document creation: {msgType, parentID, fileID, name}
msgTypes.server.createDocument = 56;
// sent after folder creation: {msgType, parentID, fileID, name}
msgTypes.server.createFolder = 57;
// sent after document deletion: {msgType, fileID}
msgTypes.server.deleteDocument = 58;
// sent after folder deletion, no messages are sent for nested files: {msgType, fileID}
msgTypes.server.deleteFolder = 59;
// sent after file renaming: {msgType, fileID, name}
msgTypes.server.renameFile = 60;

module.exports = msgTypes;
