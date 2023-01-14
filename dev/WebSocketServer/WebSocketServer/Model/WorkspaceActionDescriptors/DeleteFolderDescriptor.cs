using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSocketServer.Model.WorkspaceActionDescriptors
{
    internal class DeleteFolderDescriptor : WorkspaceActionDescriptor
    {
        public Client Client { get; set; }
        public int FileID { get; set; }

        public DeleteFolderDescriptor(Client client, int fileID)
        {
            Client = client;
            FileID = fileID;
        }
    }
}
