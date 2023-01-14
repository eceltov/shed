using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace WebSocketServer.Parsers.MessageParsers
{
    public class ClientCreateFolderMessage : ClientMessage
    {
        public ClientCreateFolderMessage() { }

        public ClientCreateFolderMessage(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<ClientCreateFolderMessage>(jsonString);
            MsgType = source.MsgType;
            ParentID = source.ParentID;
            Name = source.Name;
        }

        [JsonProperty("parentID")] public int ParentID { get; set; }
        [JsonProperty("name")] public string Name { get; set; }
    }
}
