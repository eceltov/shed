using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace WebSocketServer.Parsers.MessageParsers
{
    public class ClientConnectMessage : ClientMessage
    {
        public ClientConnectMessage() { }

        public ClientConnectMessage(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<ClientConnectMessage>(jsonString);
            MsgType = source.MsgType;
            Token = source.Token;
            WorkspaceHash = source.WorkspaceHash;
        }

        [JsonProperty("token")] public string Token { get; set; }
        [JsonProperty("workspaceHash")] public string WorkspaceHash { get; set; }
    }
}
