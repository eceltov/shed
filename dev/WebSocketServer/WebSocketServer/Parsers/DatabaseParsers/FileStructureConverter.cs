using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.Configuration;

namespace WebSocketServer.Parsers.DatabaseParsers
{
    internal class FileStructureConverter : JsonConverter
    {
        public override bool CanConvert(Type objectType)
        {
            return (objectType == typeof(File));
        }

        public override object ReadJson(JsonReader reader, Type objectType, object? existingValue, JsonSerializer serializer)
        {
            JObject fileObject = JObject.Load(reader);
            File file = new File();
            file.ID = (int)fileObject["ID"];
            file.Type = (FileTypes)((int)fileObject["type"]);
            file.Name = (string)fileObject["name"];

            if (file.Type == FileTypes.Document)
            {
                file = new Document(file);
            }
            else if (file.Type == FileTypes.Folder)
            {
                Folder folder = new Folder(file);
                JObject items = (JObject)fileObject["items"];
                folder.Items = items.ToObject<Dictionary<string, File>>();
                file = folder;
            }

            return file;
        }

        public override void WriteJson(JsonWriter writer, object? value, JsonSerializer serializer)
        {
            File? file = value as File;
            if (file == null)
                return;

            writer.WriteStartObject();
            writer.WritePropertyName("type");
            writer.WriteValue(file.Type);
            writer.WritePropertyName("ID");
            writer.WriteValue(file.ID);
            writer.WritePropertyName("name");
            writer.WriteValue(file.Name);

            if (file is Folder folder)
            {
                writer.WritePropertyName("items");
                writer.WriteStartObject();

                foreach (var item in folder.Items)
                {
                    writer.WritePropertyName(item.Key);
                    WriteJson(writer, item.Value, serializer);
                }

                writer.WriteEndObject();
            }

            writer.WriteEndObject();
        }
    }
}
