using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace WebSocketServer.Parsers.MessageParsers
{
    public class ClientDeleteFolderMessage : ClientMessage
    {
        public ClientDeleteFolderMessage() { }

        public ClientDeleteFolderMessage(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<ClientDeleteFolderMessage>(jsonString);
            MsgType = source.MsgType;
            FileID = source.FileID;
        }

        [JsonProperty("fileID")] public int FileID { get; set; }
    }
}
