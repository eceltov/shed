using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace WebSocketServer.Parsers
{
    public class ClientMessage
    {
        public ClientMessage() { }

        public ClientMessage(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<ClientMessage>(jsonString);
            msgType = source.msgType;
        }

        [JsonProperty("msgType")] public int msgType { get; set; }
    }
}
