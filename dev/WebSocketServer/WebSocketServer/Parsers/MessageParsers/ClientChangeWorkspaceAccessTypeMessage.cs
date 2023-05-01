using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using WebSocketServer.Model;

namespace WebSocketServer.Parsers.MessageParsers
{
    public class ClientChangeWorkspaceAccessTypeMessage : ClientMessage
    {
        public ClientChangeWorkspaceAccessTypeMessage() { }

        public ClientChangeWorkspaceAccessTypeMessage(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<ClientChangeWorkspaceAccessTypeMessage>(jsonString);
            MsgType = source.MsgType;
            AccessType = source.AccessType;
        }

        [JsonProperty("accessType")] public WorkspaceAccessTypes AccessType { get; set; }
    }
}
