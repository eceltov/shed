using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;

namespace WebSocketServer.Utilities.TextOperationsWriters
{
    internal static class WHBJsonWriter
    {
        public static void WriteJson(JsonWriter writer, List<WrappedOperation> wHB, JsonSerializer serializer)
        {
            writer.WriteStartArray();
            foreach (WrappedOperation wOperation in wHB)
                WOperationJsonWriter.WriteJson(writer, wOperation, serializer);
            writer.WriteEndArray();
        }
    }
}
