using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;

namespace WebSocketServer.Utilities.TextOperationsWriters
{
    internal static class WDifJsonWriter
    {
        public static void WriteJson(JsonWriter writer, List<SubdifWrap> wDif, JsonSerializer serializer)
        {
            writer.WriteStartArray();
            foreach (SubdifWrap wrap in wDif)
                WrapJsonWriter.WriteJson(writer, wrap, serializer);
            writer.WriteEndArray();
        }
    }
}
