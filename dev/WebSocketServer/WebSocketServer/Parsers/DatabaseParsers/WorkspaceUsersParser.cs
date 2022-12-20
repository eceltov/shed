using System;
using System.Globalization;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using WebSocketServer.Model;

namespace WebSocketServer.Parsers.DatabaseParsers
{
    public class WorkspaceUsersParser
    {
        public WorkspaceUsersParser() { }

        public WorkspaceUsersParser(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<Dictionary<string, int>>(jsonString);
            users = source;
        }

        public static WorkspaceUsersParser GetDefault(string ownerID)
        {
            var users = new Dictionary<string, int>();
            users.Add(ownerID, (int)Roles.owner);

            return new WorkspaceUsersParser(ownerID)
            {
                users = users,
            };
        }

        public Dictionary<string, int> users { get; set; }
    }
}
