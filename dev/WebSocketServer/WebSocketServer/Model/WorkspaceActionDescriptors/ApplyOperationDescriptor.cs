using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;

namespace WebSocketServer.Model.WorkspaceActionDescriptors
{
    internal class ApplyOperationDescriptor : IWorkspaceActionDescriptor
    {
        ///TODO: make setters private
        public Client Client { get; set; }
        public Operation Operation { get; set; }
        public int DocumentID { get; set; }

        public ApplyOperationDescriptor(Client client, Operation operation, int documentID)
        {
            Client = client;
            Operation = operation;
            DocumentID = documentID;
        }

        public bool Execute(Workspace workspace)
        {
            return workspace.HandleOperation(Client, Operation, DocumentID);
        }
    }
}
