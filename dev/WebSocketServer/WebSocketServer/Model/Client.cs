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
        public bool Guest { get; }

        public ConcurrentDictionary<int, DocumentInstance> OpenDocuments { get; }

        Client(User user, Workspace workspace, ClientInterface clientInterface, bool guest)
        {
            ID = Interlocked.Increment(ref nextID);
            User = user;
            ClientInterface = clientInterface;
            Role = Roles.None;
            OpenDocuments = new ();
            Workspace = workspace;
            Guest = guest;

            foreach (var workspaceDescriptor in User.Workspaces)
            {
                if (workspaceDescriptor.ID == workspace.ID)
                {
                    Role = workspaceDescriptor.Role;
                    break;
                }
            }
        }

        /// <summary>
        /// Creates a new Client instance.
        /// </summary>
        /// <param name="userID">
        /// The userID of the connecting client.
        /// If null, the Client is constructed as a guest with no underlying structures.
        /// </param>
        /// <param name="workspace">The workspace to which the client requests access.</param>
        /// <param name="clientInterface">The interface through which the client communicates.</param>
        /// <returns>Returns a new Client, or null if the userID was not found in the database.</returns>
        public static async Task<Client?> CreateClientAsync(string? userID, Workspace workspace, ClientInterface clientInterface)
        {
            // create guest client
            if (userID == null)
            {
                var guestUser = User.CreateGuestUser();
                return new Client(guestUser, workspace, clientInterface, true);
            }

            // create regular client
            if (await DatabaseProvider.Database.GetUserAsync(userID) is not User user)
                return null;

            return new Client(user, workspace, clientInterface, false);
        }
    }
}
