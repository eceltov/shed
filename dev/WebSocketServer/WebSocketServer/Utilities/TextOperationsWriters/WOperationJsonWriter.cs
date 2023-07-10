using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;

namespace WebSocketServer.Utilities.TextOperationsWriters
{
    internal static class WOperationJsonWriter
    {
        public static void WriteJson(JsonWriter writer, WrappedOperation wOperation, JsonSerializer serializer)
        {
            writer.WriteStartArray();
            OperationMetadataJsonWriter.WriteJson(writer, wOperation.Metadata, serializer);
            WDifJsonWriter.WriteJson(writer, wOperation.wDif, serializer);
            writer.WriteEndArray();
        }
    }
}
