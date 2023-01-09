using Newtonsoft.Json;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.MessageProcessing;
using WebSocketServer.Model.WorkspaceActionDescriptors;
using WebSocketServer.Parsers.DatabaseParsers;

namespace WebSocketServer.Model
{
    internal class Workspace
    {
        public FileStructure FileStructure { get; private set; }
        public WorkspaceUsers Users { get; private set; }
        public string Name { get; private set; }
        public string ID { get; private set; }

        /// <summary>
        /// Maps client IDs to Client instances.
        /// </summary>
        public Dictionary<int, Client> Clients { get; private set; }

        /// <summary>
        /// Maps document file IDs to active DocumentInstances.
        /// Active documents are those that are currently opened by at least
        /// </summary>
        public Dictionary<int, DocumentInstance> ActiveDocuments { get; private set; }

        BlockingCollection<WorkspaceActionDescriptor> actionDescriptors;
        Thread workerThread;


        public Workspace(string ID, string name, FileStructure fileStructure, WorkspaceUsers users)
        {
            this.ID = ID;
            Name = name;
            FileStructure = fileStructure;
            Users = users;
            Clients = new();
            actionDescriptors = new();
            ActiveDocuments = new();

            workerThread = new Thread(() => ProcessActions(CancellationToken.None));
            workerThread.Start();
        }

        public void ScheduleAction(WorkspaceActionDescriptor actionDescriptor)
        {
            actionDescriptors.Add(actionDescriptor);
        }

        void ProcessActions(CancellationToken cancellationToken)
        {
            foreach (var actionDescriptor in actionDescriptors.GetConsumingEnumerable(cancellationToken))
            {
                if (actionDescriptor is ConnectClientDescriptor connectClientDescriptor)
                    HandleConnectClient(connectClientDescriptor.Client);
                else if (actionDescriptor is GetDocumentDescriptor getDocumentDescriptor)
                    HandleGetDocument(getDocumentDescriptor.Client, getDocumentDescriptor.FileID);
            }
        }

        bool ClientCanJoin(Client client)
        {
            if (client == null)
            {
                Console.WriteLine($"Error in ClientCanJoin: client is null.");
                return false;
            }

            if (client.Role == Roles.None)
            {
                Console.WriteLine($"Error in ClientCanJoin: client {client.ID} has insufficient access rights.");
                return false;
            }

            if (Clients.ContainsKey(client.ID))
            {
                Console.WriteLine($"Error in ClientCanJoin: client {client.ID} already present.");
                return false;
            }

            return true;
        }

        bool ConnectClientToDocument(Client client, int fileID)
        {
            if (!RoleHandler.CanView(client.Role))
                return false;

            DocumentInstance documentInstance;

            if (!ActiveDocuments.ContainsKey(fileID))
            {
                if (StartDocument(fileID) is DocumentInstance newDocument)
                {
                    documentInstance = newDocument;
                }
                else
                {
                    // the document could not be instantiated
                    /// TODO: send an error message
                    Console.WriteLine("Error: DocumentInstance could not be started.");
                    return false;
                }
            }
            else
            {
                documentInstance = ActiveDocuments[fileID];
            }

            // handle client already connected to the document
            /// TODO: this should probably be handled sooner than here
            if (documentInstance.ClientPresent(client.ID))
            {
                Console.WriteLine("Error: Connecting client to a document when already connected.");
                return false;
            }

            client.OpenDocuments.Add(fileID, documentInstance);
            documentInstance.AddClient(client);

            return true;
        }

        DocumentInstance? StartDocument(int fileID)
        {
            if (ActiveDocuments.ContainsKey(fileID))
            {
                Console.WriteLine($"Error: Attempted to start already active document (ID ${fileID}).");
                return null;
            }

            if (FileStructure.GetFileFromID(fileID) is not Document document)
            {
                Console.WriteLine($"Error: Attempted to start invalid document (ID ${fileID}).");
                return null;
            }

            string? documentPath = FileStructure.GetAbsolutePath(fileID);
            if (documentPath == null) return null;

            DocumentInstance? documentInstance = DocumentInstance.CreateDocumentInstance(document, ID, documentPath);
            if (documentInstance == null) return null;

            ActiveDocuments.Add(fileID, documentInstance);
            return documentInstance;
        }

        bool HandleConnectClient(Client client)
        {
            if (!ClientCanJoin(client))
                return false;

            var initMsg = new InitWorkspaceMessage(client.ID, FileStructure, client.Role);
            client.ClientInterface.Send(initMsg);

            return true;
        }

        bool HandleGetDocument(Client client, int fileID)
        {
            if (FileStructure.IsDocument(fileID))
            {
                ConnectClientToDocument(client, fileID);
                return true;
            }

            return false;
        }
    }
}






