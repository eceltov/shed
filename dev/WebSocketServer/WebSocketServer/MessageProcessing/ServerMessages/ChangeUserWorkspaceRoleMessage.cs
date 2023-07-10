using Newtonsoft.Json;
using WebSocketServer.Model;
using WebSocketServer.Parsers.DatabaseParsers;

namespace WebSocketServer.MessageProcessing.ServerMessages
{
    internal class ChangeUserWorkspaceRoleMessage
    {
        [JsonProperty("msgType")] public ServerMessageTypes MsgType { get; } = ServerMessageTypes.ChangeUserWorkspaceRole;
        [JsonProperty("role")] public Roles Role { get; set; }

        public ChangeUserWorkspaceRoleMessage(Roles role)
        {
            Role = role;
        }
    }
}
