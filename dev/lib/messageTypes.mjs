const msgTypes = {
  // messages sent by clients
  client: {
    // sent after connecting alongside desired workspace hash and authentication data
    connect: 0,
    // sent to get the initial document state
    getDocument: 1,
    // sent with metadata used in the GC process
    GCMetadataResponse: 2,
    // sent to create a new document: {msgType, parentID, name}
    createDocument: 3,
    // sent to create a new folder: {msgType, parentID, name}
    createFolder: 4,
    // sent to delete a document: {msgType, fileID}
    deleteDocument: 5,
    // sent to delete a folder: {msgType, fileID}
    deleteFolder: 6,
    // sent to rename a file: {msgType, fileID, name}
    renameFile: 7,
    // sent to stop receiving operations from that document: {msgType, fileID}
    closeDocument: 8,
  },

  // messages sent by server
  server: {
    // sent alongside necessary data to initialize the client workspace
    initialize: 51,
    // sent alongside the folder structure of the workspace
    initWorkspace: 52,
    // send the initial document state
    initDocument: 53,
    // sent to start the GC process
    GCMetadataRequest: 54,
    // a command to collect garbage
    GC: 55,
    // sent after document creation: {msgType, parentID, fileID, name}
    createDocument: 56,
    // sent after folder creation: {msgType, parentID, fileID, name}
    createFolder: 57,
    // sent after document deletion: {msgType, fileID}
    deleteDocument: 58,
    // sent after folder deletion, no messages are sent for nested files: {msgType, fileID}
    deleteFolder: 59,
    // sent after file renaming: {msgType, fileID, name}
    renameFile: 60,
  },
};

export default msgTypes;
