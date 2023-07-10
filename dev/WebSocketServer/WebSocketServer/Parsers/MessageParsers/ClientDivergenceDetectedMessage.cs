using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace WebSocketServer.Parsers.MessageParsers
{
    public class ClientDivergenceDetectedMessage : ClientMessage
    {
        public ClientDivergenceDetectedMessage() { }

        public ClientDivergenceDetectedMessage(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<ClientDivergenceDetectedMessage>(jsonString);
            MsgType = source.MsgType;
            DocumentID = source.DocumentID;
        }

        [JsonProperty("fileID")] public int DocumentID { get; set; }
    }
}
