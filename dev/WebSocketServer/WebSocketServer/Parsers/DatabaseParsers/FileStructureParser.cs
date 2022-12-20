using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace WebSocketServer.Parsers.DatabaseParsers
{
    public class FileStructureParser
    {
        public FileStructureParser() { }

        public FileStructureParser(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<FileStructureParser>(jsonString);
            nextID = source.nextID;
            type = source.type;
            ID = source.ID;
            name = source.name;
            items = source.items;
        }

        public static FileStructureParser GetDefault(string workspaceName)
        {
            return new FileStructureParser()
            {
                nextID = 1,
                type = 1,
                ID = 0,
                name = workspaceName,
                items = new Dictionary<string, File>()
            };
        }

        [JsonProperty("nextID")] public int nextID { get; set; }
        [JsonProperty("type")] public int type { get; set; }
        [JsonProperty("ID")] public int ID { get; set; }
        [JsonProperty("name")] public string name { get; set; }
        [JsonProperty("items")] public Dictionary<string, File> items { get; set; }
    }

    [JsonConverter(typeof(FileStructureConverter))]
    public class File
    {
        public File() { }

        public File(File other)
        {
            this.ID = other.ID;
            this.name = other.name;
            this.type = other.type;
        }

        [JsonProperty("type")] public int type { get; set; }
        [JsonProperty("ID")] public int ID { get; set; }
        [JsonProperty("name")] public string name { get; set; }
    }

    public class Document : File
    {
        public Document() { }

        public Document(File file) : base(file) { }
    }

    public class Folder : File
    {
        public Folder() { }

        public Folder(File file) : base(file) { }

        [JsonProperty("items")] public Dictionary<string, File> items { get; set; }
    }
}
