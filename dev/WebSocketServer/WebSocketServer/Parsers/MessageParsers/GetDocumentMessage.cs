using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace WebSocketServer.Parsers.MessageParsers
{
    public class GetDocumentMessage : ClientMessage
    {
        public GetDocumentMessage() { }

        public GetDocumentMessage(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<GetDocumentMessage>(jsonString);
            MsgType = source.MsgType;
            FileID = source.FileID;
        }

        [JsonProperty("fileID")] public int FileID { get; set; }
    }
}
