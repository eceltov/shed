using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;

namespace WebSocketServer.Utilities.TextOperationsWriters
{
    internal static class SOJsonWriter
    {
        public static void WriteJson(JsonWriter writer, List<OperationMetadata> SO, JsonSerializer serializer)
        {
            writer.WriteStartArray();
            foreach (OperationMetadata metadata in SO)
                OperationMetadataJsonWriter.WriteJson(writer, metadata, serializer);
            writer.WriteEndArray();
        }
    }
}
