using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSocketServer.Model.WorkspaceActionDescriptors
{
    internal class ConnectClientDescriptor : WorkspaceActionDescriptor
    {
        public Client Client { get; set; }

        public ConnectClientDescriptor(Client client)
        {
            Client = client;
        }
    }
}
