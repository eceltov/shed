using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace WebSocketServer.Parsers.MessageParsers
{
    public class ClientForceDocumentMessage : ClientMessage
    {
        public ClientForceDocumentMessage() { }

        public ClientForceDocumentMessage(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<ClientForceDocumentMessage>(jsonString);
            MsgType = source.MsgType;
            DocumentID = source.DocumentID;
            Document = source.Document;
        }

        [JsonProperty("fileID")] public int DocumentID { get; set; }
        [JsonProperty("document")] public List<string> Document { get; set; }
    }
}
