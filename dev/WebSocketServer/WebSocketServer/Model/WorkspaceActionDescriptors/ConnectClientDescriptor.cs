using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSocketServer.Model.WorkspaceActionDescriptors
{
    internal class ConnectClientDescriptor : IWorkspaceActionDescriptor
    {
        public Client Client { get; init; }

        public ConnectClientDescriptor(Client client)
        {
            Client = client;
        }

        public bool Execute(Workspace workspace)
        {
            return workspace.HandleConnectClient(Client);
        }
    }
}
