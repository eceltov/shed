using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using WebSocketServer.Model;

namespace WebSocketServer.Parsers.MessageParsers
{
    public class ClientAddUserToWorkspacetMessage : ClientMessage
    {
        public ClientAddUserToWorkspacetMessage() { }

        public ClientAddUserToWorkspacetMessage(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<ClientAddUserToWorkspacetMessage>(jsonString);
            MsgType = source.MsgType;
            Username = source.Username;
            Role = source.Role;
        }

        [JsonProperty("username")] public string Username { get; set; }
        [JsonProperty("role")] public Roles Role { get; set; }
    }
}
