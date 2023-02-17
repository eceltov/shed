using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;
using WebSocketServer.Utilities.TextOperationsWriters;

namespace WebSocketServer.Utilities.TextOperationsConverters
{
    internal class WOperationConverter : JsonConverter
    {
        public override bool CanConvert(Type objectType)
        {
            return (objectType == typeof(WrappedOperation));
        }

        public override object ReadJson(JsonReader reader, Type objectType, object? existingValue, JsonSerializer serializer)
        {
            throw new NotImplementedException();
        }

        public override void WriteJson(JsonWriter writer, object? value, JsonSerializer serializer)
        {
            WrappedOperation wOperation = (WrappedOperation)value;

            WOperationJsonWriter.WriteJson(writer, wOperation, serializer);
        }
    }
}
