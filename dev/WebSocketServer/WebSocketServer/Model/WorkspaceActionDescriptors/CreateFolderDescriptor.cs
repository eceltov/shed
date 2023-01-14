using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSocketServer.Model.WorkspaceActionDescriptors
{
    internal class CreateFolderDescriptor : WorkspaceActionDescriptor
    {
        public Client Client { get; set; }
        public int ParentID { get; set; }
        public string Name { get; set; }

        public CreateFolderDescriptor(Client client, int parentID, string name)
        {
            Client = client;
            ParentID = parentID;
            Name = name;
        }
    }
}
