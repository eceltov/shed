using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSocketServer.Model.WorkspaceActionDescriptors
{
    internal class RenameFileDescriptor : IWorkspaceActionDescriptor
    {
        public Client Client { get; init; }
        public int FileID { get; init; }
        public string Name { get; init; }

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
