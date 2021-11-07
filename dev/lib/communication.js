if (typeof com === 'undefined') {
    // Export for browsers
    var com = {};
    com.msgTypes = {};
}

com.msgTypes.initialize = 0;
com.msgTypes.GCMetadataRequest = 1;
com.msgTypes.GCMetadataResponse = 2;
com.msgTypes.GC = 3;

module.exports = com;
