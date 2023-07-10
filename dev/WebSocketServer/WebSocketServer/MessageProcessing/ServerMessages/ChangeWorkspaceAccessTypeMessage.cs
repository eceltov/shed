using Newtonsoft.Json;
using WebSocketServer.Model;
using WebSocketServer.Parsers.DatabaseParsers;

namespace WebSocketServer.MessageProcessing.ServerMessages
{
    internal class ChangeWorkspaceAccessTypeMessage
    {
        [JsonProperty("msgType")] public ServerMessageTypes MsgType { get; } = ServerMessageTypes.ChangeWorkspaceAccessType;
        [JsonProperty("accessType")] public WorkspaceAccessTypes AccessType { get; set; }

        public ChangeWorkspaceAccessTypeMessage(WorkspaceAccessTypes accessType)
        {
            AccessType = accessType;
        }
    }
}
