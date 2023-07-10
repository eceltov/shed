using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using WebSocketServer.Model;

namespace WebSocketServer.Parsers.MessageParsers
{
    public class ClientMessage
    {
        public ClientMessage() { }

        public ClientMessage(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<ClientMessage>(jsonString);
            MsgType = source.MsgType;
        }

        [JsonProperty("msgType")] public ClientMessageTypes MsgType { get; set; }
    }
}
