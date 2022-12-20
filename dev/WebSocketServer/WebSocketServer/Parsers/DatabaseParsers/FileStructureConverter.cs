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

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            JObject fileObject = JObject.Load(reader);
            File file = new File();
            file.ID = (int)fileObject["ID"];
            file.type = (int)fileObject["type"];
            file.name = (string)fileObject["name"];

            if (file.type == ConfigurationManager.Configuration.Database.fileTypes.document)
            {
                file = new Document(file);
            }
            else if (file.type == ConfigurationManager.Configuration.Database.fileTypes.folder)
            {
                Folder folder = new Folder(file);
                JObject items = (JObject)fileObject["items"];
                folder.items = items.ToObject<Dictionary<string, File>>();
                file = folder;
            }

            return file;
        }

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            throw new NotImplementedException();
        }
    }
}
