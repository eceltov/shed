using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSocketServer.Model.WorkspaceActionDescriptors
{
    internal class CreateFolderDescriptor : IWorkspaceActionDescriptor
    {
        public Client Client { get; init; }
        public int ParentID { get; init; }
        public string Name { get; init; }

        public CreateFolderDescriptor(Client client, int parentID, string name)
        {
            Client = client;
            ParentID = parentID;
            Name = name;
        }

        public bool Execute(Workspace workspace)
        {
            return workspace.HandleCreateFolder(Client, ParentID, Name);
        }
    }
}
