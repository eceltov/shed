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
            msgType = source.msgType;
            token = source.token;
            workspaceHash = source.workspaceHash;
        }

        [JsonProperty("token")] public string token { get; set; }
        [JsonProperty("workspaceHash")] public string workspaceHash { get; set; }
    }
}
