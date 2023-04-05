using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSocketServer.Model.WorkspaceActionDescriptors
{
    internal class GCMetadataDescriptor : IWorkspaceActionDescriptor
    {
        public Client Client { get; init; }
        public int DocumentID { get; init; }
        public int Dependency { get; init; }

        public GCMetadataDescriptor(Client client, int documentID, int dependency)
        {
            Client = client;
            DocumentID = documentID;
            Dependency = dependency;
        }

        public bool Execute(Workspace workspace)
        {
            return workspace.HandleGCMetadata(Client, DocumentID, Dependency);
        }
    }
}
