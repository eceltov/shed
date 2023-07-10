using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;

namespace WebSocketServer.Utilities.TextOperationsWriters
{
    internal static class DifJsonWriter
    {
        public static void WriteJson(JsonWriter writer, List<Subdif> dif, JsonSerializer serializer)
        {
            writer.WriteStartArray();
            foreach (Subdif subdif in dif)
                SubdifJsonWriter.WriteJson(writer, subdif, serializer);
            writer.WriteEndArray();
        }
    }
}
