using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace WebSocketServer.Parsers.MessageParsers
{
    public class ClientGCMetadataMessage : ClientMessage
    {
        public ClientGCMetadataMessage() { }

        public ClientGCMetadataMessage(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<ClientGCMetadataMessage>(jsonString);
            MsgType = source.MsgType;
            ClientID = source.ClientID;
            DocumentID = source.DocumentID;
            Dependency = source.Dependency;
        }

        [JsonProperty("clientID")] public int ClientID { get; set; }
        [JsonProperty("fileID")] public int DocumentID { get; set; }
        [JsonProperty("dependancy")] public int Dependency { get; set; }
    }
}
