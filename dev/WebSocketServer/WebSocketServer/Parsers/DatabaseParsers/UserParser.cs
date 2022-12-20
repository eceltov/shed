using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using WebSocketServer.Model;

namespace WebSocketServer.Parsers.DatabaseParsers
{
    public class UserParser
    {
        public UserParser() { }

        public UserParser(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<UserParser>(jsonString);
            id = source.id;
            role = source.role;
            workspaces = source.workspaces;
        }

        [JsonProperty("id")] public string id { get; set; }
        [JsonProperty("role")] public string role { get; set; }
        [JsonProperty("workspaces")] public List<Workspace> workspaces { get; set; }
    }

    public class Workspace
    {
        [JsonProperty("id")] public string id { get; set; }
        [JsonProperty("name")] public string name { get; set; }
        [JsonProperty("role")] public Roles role { get; set; }
    }
}
