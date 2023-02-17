using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;
using WebSocketServer.Configuration;

namespace WebSocketServer.Parsers.MessageParsers
{
    internal class ClientOperationMessageConverter : JsonConverter
    {
        public override bool CanConvert(Type objectType)
        {
            return objectType == typeof(ClientOperationMessage);
        }

        public override object ReadJson(JsonReader reader, Type objectType, object? existingValue, JsonSerializer serializer)
        {
            JArray opObject = JArray.Load(reader);
            JArray metaObject = (JArray)opObject[0];
            JArray difObject = (JArray)opObject[1];

            int documentID = (int)opObject[2];
            var rawMeta = metaObject.ToObject<int[]>();
            var rawDif = difObject.ToObject<object[][]>();

            OperationMetadata metadata = new(rawMeta[0], rawMeta[1], rawMeta[2], rawMeta[3]);

            List<Subdif> dif = new();
            foreach (object[] rawSubdif in rawDif)
            {
                int row = Convert.ToInt32(rawSubdif[0]);
                int position = Convert.ToInt32(rawSubdif[1]);

                if (rawSubdif[2] is string content)
                {
                    Add add = new(row, position, content);
                    dif.Add(add);
                }
                else if (rawSubdif[2] is long count)
                {
                    ///TODO: the conversion should be probably handled differently
                    Del del = new(row, position, Convert.ToInt32(count));
                    dif.Add(del);
                }
                else if ((bool)rawSubdif[2] == true)
                {
                    Newline newline = new(row, position);
                    dif.Add(newline);
                }
                else
                {
                    Remline remline = new(row, position);
                    dif.Add(remline);
                }
            }

            return new ClientOperationMessage()
            {
                Operation = new Operation(metadata, dif),
                DocumentID = documentID,
            };
        }

        public override void WriteJson(JsonWriter writer, object? value, JsonSerializer serializer)
        {
            throw new NotImplementedException();
        }
    }
}
