using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace WebSocketServer.Parsers.MessageParsers
{
    public class ClientDeleteDocumentMessage : ClientMessage
    {
        public ClientDeleteDocumentMessage() { }

        public ClientDeleteDocumentMessage(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<ClientDeleteDocumentMessage>(jsonString);
            MsgType = source.MsgType;
            FileID = source.FileID;
        }

        [JsonProperty("fileID")] public int FileID { get; set; }
    }
}
