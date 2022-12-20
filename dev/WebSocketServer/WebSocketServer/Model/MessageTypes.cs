using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSocketServer.Model
{
    public enum ClientMessageTypes
    {
        // sent after connecting alongside desired workspace hash and authentication data
        Connect = 0,
        // sent to get the initial document state
        GetDocument = 1,
        // sent with metadata used in the GC process
        GCMetadataResponse = 2,
        // sent to create a new document: {msgType, parentID, name}
        CreateDocument = 3,
        // sent to create a new folder: {msgType, parentID, name}
        CreateFolder = 4,
        // sent to delete a document: {msgType, fileID}
        DeleteDocument = 5,
        // sent to delete a folder: {msgType, fileID}
        DeleteFolder = 6,
        // sent to rename a file: {msgType, fileID, name}
        RenameFile = 7,
        // sent to stop receiving operations from that document: {msgType, fileID}
        CloseDocument = 8,
        // sent to delete a workspace: {msgType}
        DeleteWorkspace = 9
    }

    public enum ServerMessageTypes
    {
        // sent alongside necessary data to initialize the client workspace
        Initialize = 51,
        // sent alongside the folder structure of the workspace
        InitWorkspace = 52,
        // send the initial document state
        InitDocument = 53,
        // sent to start the GC process
        GCMetadataRequest = 54,
        // a command to collect garbage
        GC = 55,
        // sent after document creation: {msgType, parentID, fileID, name}
        CreateDocument = 56,
        // sent after folder creation: {msgType, parentID, fileID, name}
        CreateFolder = 57,
        // sent after document deletion: {msgType, fileID}
        DeleteDocument = 58,
        // sent after folder deletion, no messages are sent for nested files: {msgType, fileID}
        DeleteFolder = 59,
        // sent after file renaming: {msgType, fileID, name}
        RenameFile = 60,
        // sent after failed token verification: {msgType}
        FailedValidation = 61,
        // sent before the workspace deletes: {msgType}
        DeleteWorkspace = 62
    }
}
