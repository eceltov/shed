using Newtonsoft.Json;
using WebSocketServer.Model;
using WebSocketServer.Parsers.DatabaseParsers;

namespace WebSocketServer.MessageProcessing.ServerMessages
{
    internal class InitWorkspaceMessage
    {
        [JsonProperty("msgType")] public ServerMessageTypes MsgType { get; } = ServerMessageTypes.InitWorkspace;
        [JsonProperty("clientID")] public int ClientID { get; set; }
        [JsonProperty("fileStructure")] public FileStructure FileStructure { get; set; }
        [JsonProperty("role")] public Roles Role { get; set; }
        [JsonProperty("accessType")] public WorkspaceAccessTypes AccessType { get; set; }

        public InitWorkspaceMessage(int clientID, FileStructure fileStructure, Roles role, WorkspaceAccessTypes accessType)
        {
            ClientID = clientID;
            FileStructure = fileStructure;
            Role = role;
            AccessType = accessType;
        }
    }
}
