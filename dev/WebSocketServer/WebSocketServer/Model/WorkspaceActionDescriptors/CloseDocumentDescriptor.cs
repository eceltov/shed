using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSocketServer.Model.WorkspaceActionDescriptors
{
    internal class CloseDocumentDescriptor : IWorkspaceActionDescriptor
    {
        public Client Client { get; set; }
        public int DocumentID { get; set; }

        public CloseDocumentDescriptor(Client client, int documentID)
        {
            Client = client;
            DocumentID = documentID;
        }

        public bool Execute(Workspace workspace)
        {
            return workspace.HandleCloseDocument(Client, DocumentID);
        }
    }
}
