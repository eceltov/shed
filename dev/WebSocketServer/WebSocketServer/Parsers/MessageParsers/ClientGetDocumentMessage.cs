using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace WebSocketServer.Parsers.MessageParsers
{
    public class ClientGetDocumentMessage : ClientMessage
    {
        public ClientGetDocumentMessage() { }

        public ClientGetDocumentMessage(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<ClientGetDocumentMessage>(jsonString);
            MsgType = source.MsgType;
            FileID = source.FileID;
        }

        [JsonProperty("fileID")] public int FileID { get; set; }
    }
}
