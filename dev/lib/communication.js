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

com.clientMsg.connect = 0; // sent after connecting alongside desired workspace hash and authentication data
com.clientMsg.getDocument = 1; // sent to get the initial document state
com.clientMsg.GCMetadataResponse = 2; // sent with metadata used in the GC process

com.serverMsg.initialize = 51; // sent alongside necessary data to initialize the client workspace
com.serverMsg.sentDocument = 52; // send the initial document state
com.serverMsg.initWorkspace = 53; // sent alongside the folder structure of the workspace
com.serverMsg.GCMetadataRequest = 54; // sent to start the GC process
com.serverMsg.GC = 55; // a command to collect garbage

module.exports = com;
