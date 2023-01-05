using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace WebSocketServer.Parsers.DatabaseParsers
{
    public enum FileTypes
    {
        Document = 0,
        Folder = 1
    }

    [JsonConverter(typeof(FileStructureConverter))]
    public class File
    {
        public File() { }

        public File(File other)
        {
            this.ID = other.ID;
            this.Name = other.Name;
            this.Type = other.Type;
        }

        [JsonProperty("type")] public FileTypes Type { get; set; }
        [JsonProperty("ID")] public int ID { get; set; }
        [JsonProperty("name")] public string Name { get; set; }
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

        [JsonProperty("items")] public Dictionary<string, File> Items { get; set; }
    }

    public class FileStructure
    {
        public FileStructure() { }

        public FileStructure(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<FileStructure>(jsonString);
            NextID = source.NextID;
            FileType = source.FileType;
            ID = source.ID;
            Name = source.Name;
            Items = source.Items;
        }

        public static FileStructure GetDefault(string workspaceName)
        {
            return new FileStructure()
            {
                NextID = 1,
                FileType = FileTypes.Folder,
                ID = 0,
                Name = workspaceName,
                Items = new Dictionary<string, File>()
            };
        }

        [JsonProperty("nextID")] public int NextID { get; set; }
        [JsonProperty("type")] public FileTypes FileType { get; set; }
        [JsonProperty("ID")] public int ID { get; set; }
        [JsonProperty("name")] public string Name { get; set; }
        [JsonProperty("items")] public Dictionary<string, File> Items { get; set; }
    }
}
