using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using TextOperations.Types;

namespace WebSocketServer.Parsers.MessageParsers
{
    [JsonConverter(typeof(ClientOperationMessageConverter))]
    public class ClientOperationMessage
    {
        public ClientOperationMessage() { }

        public ClientOperationMessage(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<ClientOperationMessage>(jsonString);
            Operation = source.Operation;
            DocumentID = source.DocumentID;
        }

        public Operation Operation { get; set; }
        public int DocumentID { get; set; }
    }
}
