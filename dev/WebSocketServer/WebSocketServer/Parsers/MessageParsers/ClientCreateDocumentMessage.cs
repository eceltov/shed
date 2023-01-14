using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace WebSocketServer.Parsers.MessageParsers
{
    public class ClientCreateDocumentMessage : ClientMessage
    {
        public ClientCreateDocumentMessage() { }

        public ClientCreateDocumentMessage(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<ClientCreateDocumentMessage>(jsonString);
            MsgType = source.MsgType;
            ParentID = source.ParentID;
            Name = source.Name;
        }

        [JsonProperty("parentID")] public int ParentID { get; set; }
        [JsonProperty("name")] public string Name { get; set; }
    }
}
