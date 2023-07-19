using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace WebSocketServer.Parsers.MessageParsers
{
    public class ClientDeleteWorkspaceMessage : ClientMessage
    {
        public ClientDeleteWorkspaceMessage() { }

        public ClientDeleteWorkspaceMessage(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<ClientRenameFileMessage>(jsonString);
            MsgType = source.MsgType;
        }
    }
}
