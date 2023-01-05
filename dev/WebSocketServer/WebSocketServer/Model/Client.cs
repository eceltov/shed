using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.Data;
using WebSocketServer.MessageProcessing;
using WebSocketServer.Parsers.DatabaseParsers;

namespace WebSocketServer.Model
{
    internal class Client
    {
        public int ID { get; }
        public User User { get; }
        public ClientInterface ClientInterface { get; }

        static int nextID = 0;
        Dictionary<string, Roles> workspaceRoles = new();

        Client(User user, ClientInterface clientInterface)
        {
            ID = Interlocked.Increment(ref nextID);
            User = user;
            ClientInterface = clientInterface;

            foreach (var workspace in User.Workspaces)
                workspaceRoles.Add(workspace.ID, workspace.Role);
        }

        public static Client? CreateClient(string userID, ClientInterface clientInterface)
        {
            var user = DatabaseProvider.Database.GetUser(userID);

            if (user == null)
                return null;

            return new Client(user, clientInterface);
        }

        public Roles GetWorkspaceRole(string workspaceID)
        {
            if (workspaceRoles.ContainsKey(workspaceID))
                return workspaceRoles[workspaceID];

            return Roles.None;
        }
    }
}
