using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSocketServer.Model.WorkspaceActionDescriptors
{
    internal class DeleteDocumentDescriptor : IWorkspaceActionDescriptor
    {
        public Client Client { get; init; }
        public int FileID { get; init; }

        public DeleteDocumentDescriptor(Client client, int fileID)
        {
            Client = client;
            FileID = fileID;
        }

        public bool Execute(Workspace workspace)
        {
            return workspace.HandleDeleteDocument(Client, FileID);
        }
    }
}
