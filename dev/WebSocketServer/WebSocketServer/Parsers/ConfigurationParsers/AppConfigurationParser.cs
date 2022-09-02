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
        }

        [JsonProperty("test")] public string test { get; set; }
        [JsonProperty("JWT")] public JWT JWT { get; set; }
    }

    public class JWT
    {
        [JsonProperty("Secret")] public string Secret { get; set; }
    }
}
