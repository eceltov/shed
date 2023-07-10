using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;

namespace WebSocketServer.Utilities.TextOperationsWriters
{
    internal static class SubdifJsonWriter
    {
        public static void WriteJson(JsonWriter writer, Subdif subdif, JsonSerializer serializer)
        {
            writer.WriteStartArray();
            writer.WriteValue(subdif.Row);
            writer.WriteValue(subdif.Position);

            if (subdif is Add add)
                writer.WriteValue(add.Content);
            else if (subdif is Del del)
                writer.WriteValue(del.Count);
            else if (subdif is Newline)
                writer.WriteValue(true);
            else if (subdif is Remline)
                writer.WriteValue(false);
            writer.WriteEndArray();
        }
    }
}
