using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace WebSocketServer.Parsers.MessageParsers
{
    public class ClientCloseDocumentMessage : ClientMessage
    {
        public ClientCloseDocumentMessage() { }

        public ClientCloseDocumentMessage(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<ClientCloseDocumentMessage>(jsonString);
            MsgType = source.MsgType;
            DocumentID = source.DocumentID;
        }

        [JsonProperty("fileID")] public int DocumentID { get; set; }
    }
}
