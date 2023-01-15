using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSocketServer.Model.WorkspaceActionDescriptors
{
    internal class RenameFileDescriptor : IWorkspaceActionDescriptor
    {
        public Client Client { get; set; }
        public int FileID { get; set; }
        public string Name { get; set; }

        public RenameFileDescriptor(Client client, int fileID, string name)
        {
            Client = client;
            FileID = fileID;
            Name = name;
        }

        public bool Execute(Workspace workspace)
        {
            return workspace.HandleRenameFile(Client, FileID, Name);
        }
    }
}
