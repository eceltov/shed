using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using WebSocketServer.Model;

namespace WebSocketServer.Parsers.DatabaseParsers
{
    public class UsernameToIdMap
    {
        public UsernameToIdMap() { }

        public UsernameToIdMap(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<Dictionary<string, string>>(jsonString);
            Entries = source;
        }

        public Dictionary<string, string> Entries { get; set; }
    }
}
