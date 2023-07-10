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
            if (wrap.Original == null)
                writer.WriteValue(wrap.Original);
            else
                SubdifJsonWriter.WriteJson(writer, wrap.Original, serializer);

            writer.WritePropertyName("wTransformer");
            if (wrap.wTransformer == null)
                writer.WriteValue(wrap.wTransformer);
            else
                WriteJson(writer, wrap.wTransformer, serializer);

            writer.WritePropertyName("addresser");
            if (wrap.Addresser == null)
                writer.WriteValue(wrap.Addresser);
            else
                WriteJson(writer, wrap.Addresser, serializer);

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
