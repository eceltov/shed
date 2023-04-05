using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;

namespace WebSocketServer.Model.WorkspaceActionDescriptors
{
    internal class ApplyOperationDescriptor : IDocumentActionDescriptor
    {
        ///TODO: make setters private
        public Client Client { get; init; }
        public Operation Operation { get; init; }
        public int DocumentID { get; init; }

        public ApplyOperationDescriptor(Client client, Operation operation, int documentID)
        {
            Client = client;
            Operation = operation;
            DocumentID = documentID;
        }

        public bool Execute(DocumentInstance documentInstance)
        {
            return documentInstance.HandleOperation(Client, Operation);
        }
    }
}
