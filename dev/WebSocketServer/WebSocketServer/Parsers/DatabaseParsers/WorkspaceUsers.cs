using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using WebSocketServer.Model;

namespace WebSocketServer.Parsers.DatabaseParsers
{
    public class WorkspaceUsers
    {
        public WorkspaceUsers() { }

        public WorkspaceUsers(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<Dictionary<string, int>>(jsonString);
            Users = source;
        }

        public static WorkspaceUsers GetDefault(string ownerID)
        {
            var users = new Dictionary<string, int>();
            users.Add(ownerID, (int)Roles.Owner);

            return new WorkspaceUsers(ownerID)
            {
                Users = users,
            };
        }

        public Dictionary<string, int> Users { get; set; }
    }
}
