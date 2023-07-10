using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;

namespace WebSocketServer.Utilities.TextOperationsWriters
{
    internal static class OperationJsonWriter
    {
        public static void WriteJson(JsonWriter writer, Operation operation, JsonSerializer serializer)
        {
            writer.WriteStartArray();
            OperationMetadataJsonWriter.WriteJson(writer, operation.Metadata, serializer);
            DifJsonWriter.WriteJson(writer, operation.Dif, serializer);
            writer.WriteEndArray();
        }
    }
}
