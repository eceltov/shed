using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;
using WebSocketServer.Utilities.TextOperationsWriters;

namespace WebSocketServer.Utilities.TextOperationsConverters
{
    internal class OperationMetadataConverter : JsonConverter
    {
        public override bool CanConvert(Type objectType)
        {
            return (objectType == typeof(OperationMetadata));
        }

        public override object ReadJson(JsonReader reader, Type objectType, object? existingValue, JsonSerializer serializer)
        {
            throw new NotImplementedException();
        }

        public override void WriteJson(JsonWriter writer, object? value, JsonSerializer serializer)
        {
            OperationMetadata metadata = (OperationMetadata)value;

            OperationMetadataJsonWriter.WriteJson(writer, metadata, serializer);
        }
    }
}
