using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace WebSocketServer.Parsers.ConfigurationParsers
{
    public class AppConfiguration
    {
        public AppConfiguration() { }

        public AppConfiguration(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<AppConfiguration>(jsonString);
            JWT = source.JWT;
            Database = source.Database;
        }

        [JsonProperty("JWT")] public JWT JWT { get; set; }
        [JsonProperty("Database")] public Database Database { get; set; }
    }

    public class JWT
    {
        [JsonProperty("Secret")] public string Secret { get; set; }
    }

    public class Paths
    {
        [JsonProperty("workspacesPath")] public string WorkspacesPath { get; set; }
        [JsonProperty("usersPath")] public string UsersPath { get; set; }
        [JsonProperty("workspaceRootFolderPath")] public string WorkspaceRootFolderPath { get; set; }
        [JsonProperty("fileStructurePath")] public string FileStructurePath { get; set; }
        [JsonProperty("workspaceUsersPath")] public string WorkspaceUsersPath { get; set; }
    }

    public class Database
    {
        [JsonProperty("paths")] public Paths Paths { get; set; }
        [JsonProperty("workspaceHashSalt")] public string WorkspaceHashSalt { get; set; }
    }
}
