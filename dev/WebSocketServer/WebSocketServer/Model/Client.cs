using System;
using System.Collections.Concurrent;
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
        public Roles Role { get; set; }
        public Workspace Workspace { get; }

        public ConcurrentDictionary<int, DocumentInstance> OpenDocuments { get; }

        Client(User user, Workspace workspace, ClientInterface clientInterface)
        {
            ID = Interlocked.Increment(ref nextID);
            User = user;
            ClientInterface = clientInterface;
            Role = Roles.None;
            OpenDocuments = new ();
            Workspace = workspace;

            foreach (var workspaceDescriptor in User.Workspaces)
            {
                if (workspaceDescriptor.ID == workspace.ID)
                {
                    Role = workspaceDescriptor.Role;
                    break;
                }
            }
        }

        public static Client? CreateClient(string userID, Workspace workspace, ClientInterface clientInterface)
        {
            var user = DatabaseProvider.Database.GetUser(userID);

            if (user == null)
                return null;

            return new Client(user, workspace, clientInterface);
        }
    }
}
