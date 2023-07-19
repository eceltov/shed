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
        DeleteWorkspace = 9,
        // sent after divergence was detected by the local client: {msgType, fileID}
        DivergenceDetected = 10,
        // sent to force the local document state on all clients: {msgType, fileID, document}
        ForceDocument = 11,
        // sent to add a new user to the workspace: {msgType, username, role}
        AddUserToWorkspace = 12,
        // sent to change the access type of the workspace: {msgType, accessType}
        ChangeWorkspaceAccessType = 13,
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
        DeleteWorkspace = 62,
        // sent after divergence was detected: {msgType, fileID}
        DivergenceDetected = 63,
        // sent to force the server document state: {msgType, fileID, serverDocument}
        ForceDocument = 64,
        // sent to inform about the change of the access type of the workspace: {msgType, accessType}
        ChangeWorkspaceAccessType = 65,
        // sent to clients that cannot join the workspace due to insufficient permissions: {msgType}
        ClientCannotJoin = 66,
        // sent when the requested workspace does not exist: {msgType}
        WorkspaceDoesNotExist = 67,
        // sent to inform about the change of the role of a client: {msgType, role}
        ChangeUserWorkspaceRole = 68,
    }
}
