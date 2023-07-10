using Newtonsoft.Json;
using TextOperations.Types;
using WebSocketServer.Utilities.TextOperationsWriters;

namespace WebSocketServer.MessageProcessing.ServerMessages
{
    [JsonConverter(typeof(ServerOperationMessageConverter))]
    internal class OperationMessage
    {
        public Operation Operation { get; set; }
        public int DocumentID { get; set; }

        public OperationMessage(Operation operation, int documentID)
        {
            Operation = operation;
            DocumentID = documentID;
        }
    }

    internal class ServerOperationMessageConverter : JsonConverter
    {
        public override bool CanConvert(Type objectType)
        {
            return objectType == typeof(OperationMessage);
        }

        public override object ReadJson(JsonReader reader, Type objectType, object? existingValue, JsonSerializer serializer)
        {
            throw new NotImplementedException();
        }

        public override void WriteJson(JsonWriter writer, object? value, JsonSerializer serializer)
        {
            OperationMessage message = (OperationMessage)value;

            writer.WriteStartArray();

            // metadata
            OperationMetadataJsonWriter.WriteJson(writer, message.Operation.Metadata, serializer);

            // dif
            DifJsonWriter.WriteJson(writer, message.Operation.Dif, serializer);

            // documentID
            writer.WriteValue(message.DocumentID);

            writer.WriteEndArray();
        }
    }
}
