using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace WebSocketServer.Parsers.MessageParsers
{
    public class ConnectMessage : ClientMessage
    {
        public ConnectMessage() { }

        public ConnectMessage(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<ConnectMessage>(jsonString);
            MsgType = source.MsgType;
            Token = source.Token;
            WorkspaceHash = source.WorkspaceHash;
        }

        [JsonProperty("token")] public string Token { get; set; }
        [JsonProperty("workspaceHash")] public string WorkspaceHash { get; set; }
    }
}
