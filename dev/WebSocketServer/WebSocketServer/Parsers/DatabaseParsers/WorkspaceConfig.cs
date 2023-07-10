using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using WebSocketServer.Model;

namespace WebSocketServer.Parsers.DatabaseParsers
{
    public class WorkspaceConfig
    {
        public WorkspaceConfig() { }

        public WorkspaceConfig(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<WorkspaceConfig>(jsonString);
            AccessType = source.AccessType;
        }

        [JsonProperty("access")] public WorkspaceAccessTypes AccessType { get; set; }
    }
}
