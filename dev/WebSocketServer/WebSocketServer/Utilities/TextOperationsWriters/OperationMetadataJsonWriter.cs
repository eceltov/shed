using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;

namespace WebSocketServer.Utilities.TextOperationsWriters
{
    internal static class OperationMetadataJsonWriter
    {
        public static void WriteJson(JsonWriter writer, OperationMetadata metadata, JsonSerializer serializer)
        {
            writer.WriteStartArray();
            writer.WriteValue(metadata.ClientID);
            writer.WriteValue(metadata.CommitSerialNumber);
            writer.WriteValue(metadata.PrevClientID);
            writer.WriteValue(metadata.PrevCommitSerialNumber);
            writer.WriteEndArray();
        }
    }
}
