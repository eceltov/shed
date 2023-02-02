﻿using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using WebSocketServer.Model;

namespace WebSocketServer.Parsers.DatabaseParsers
{
    public class User
    {
        public User() { }

        public User(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<User>(jsonString);
            ID = source.ID;
            Role = source.Role;
            Workspaces = source.Workspaces;
        }

        [JsonProperty("id")] public string ID { get; set; }
        [JsonProperty("role")] public string Role { get; set; }
        [JsonProperty("workspaces")] public List<Workspace> Workspaces { get; set; }
    }

    public class Workspace
    {
        [JsonProperty("id")] public string ID { get; set; }
        [JsonProperty("name")] public string Name { get; set; }
        [JsonProperty("role")] public Roles Role { get; set; }
    }
}