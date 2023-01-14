using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace WebSocketServer.Parsers.MessageParsers
{
    public class ClientRenameFileMessage : ClientMessage
    {
        public ClientRenameFileMessage() { }

        public ClientRenameFileMessage(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<ClientRenameFileMessage>(jsonString);
            MsgType = source.MsgType;
            FileID = source.FileID;
            Name = source.Name;
        }

        [JsonProperty("fileID")] public int FileID { get; set; }
        [JsonProperty("name")] public string Name { get; set; }
    }
}
