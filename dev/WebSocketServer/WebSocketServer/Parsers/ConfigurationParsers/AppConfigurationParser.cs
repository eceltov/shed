using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace WebSocketServer.Parsers.ConfigurationParsers
{
    public class AppConfigurationParser
    {
        public AppConfigurationParser() { }

        public AppConfigurationParser(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<AppConfigurationParser>(jsonString);
            test = source.test;
            JWT = source.JWT;
            Database = source.Database;
        }

        [JsonProperty("test")] public string test { get; set; }
        [JsonProperty("JWT")] public JWT JWT { get; set; }
        [JsonProperty("Database")] public Database Database { get; set; }
    }

    public class JWT
    {
        [JsonProperty("Secret")] public string Secret { get; set; }
    }

    public class Paths
    {
        [JsonProperty("workspacesPath")] public string workspacesPath { get; set; }
        [JsonProperty("usersPath")] public string usersPath { get; set; }
        [JsonProperty("workspaceRootFolderPath")] public string workspaceRootFolderPath { get; set; }
        [JsonProperty("fileStructurePath")] public string fileStructurePath { get; set; }
        [JsonProperty("workspaceUsersPath")] public string workspaceUsersPath { get; set; }
    }

    public class FileTypes
    {
        [JsonProperty("document")] public int document { get; set; }
        [JsonProperty("folder")] public int folder { get; set; }
    }

    public class Database
    {
        [JsonProperty("paths")] public Paths paths { get; set; }
        [JsonProperty("fileTypes")] public FileTypes fileTypes { get; set; }
        [JsonProperty("workspaceHashSalt")] public string workspaceHashSalt { get; set; }
    }
}
