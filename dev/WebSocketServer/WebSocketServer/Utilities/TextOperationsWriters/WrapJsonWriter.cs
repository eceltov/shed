using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;

namespace WebSocketServer.Utilities.TextOperationsWriters
{
    internal static class WrapJsonWriter
    {
        public static void WriteJson(JsonWriter writer, SubdifWrap wrap, JsonSerializer serializer)
        {
            writer.WriteStartObject();

            // subdif
            writer.WritePropertyName("sub");
            SubdifJsonWriter.WriteJson(writer, wrap.Sub, serializer);

            // meta
            writer.WritePropertyName("meta");
            writer.WriteStartObject();

            writer.WritePropertyName("ID");
            writer.WriteValue(wrap.ID);
            writer.WritePropertyName("informationLost");
            writer.WriteValue(wrap.InformationLost);
            writer.WritePropertyName("relative");
            writer.WriteValue(wrap.Relative);

            // context
            writer.WritePropertyName("context");
            writer.WriteStartObject();

            writer.WritePropertyName("original");
            writer.WriteValue(wrap.Original);
            writer.WritePropertyName("wTransformer");
            writer.WriteValue(wrap.wTransformer);
            writer.WritePropertyName("addresser");
            writer.WriteValue(wrap.Addresser);
            writer.WritePropertyName("siblings");
            serializer.Serialize(writer, wrap.Siblings);

            writer.WriteEndObject();
            // end context

            writer.WriteEndObject();
            //end meta

            writer.WriteEndObject();
        }
    }
}
