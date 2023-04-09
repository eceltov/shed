using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Operations;
using TextOperations.Types;
using WebSocketServer.Data;
using WebSocketServer.Extensions;
using WebSocketServer.MessageProcessing;
using WebSocketServer.Parsers.DatabaseParsers;
using WebSocketServer.Parsers.MessageParsers;
using WebSocketServer.Utilities;

namespace WebSocketServer.Model
{
    internal class DocumentInstance
    {
        // Maps client IDs to Client instances.
        Dictionary<int, Client> clients = new();

        Document documentFile;

        // attributes for document maintenance
        public List<string> Document { get; private set; } = new();
        List<WrappedOperation> wHB = new();
        List<OperationMetadata> serverOrdering = new();
        int firstSOMessageNumber = 0; // the total serial number of the first SO entry

        // attribute for garbage collection
        int garbageCount = 0; // current amount of messages since last GC
        ///TODO: set this value in the configuration
        int garbageMax = 5; // after how many messages to GC
        bool GCInProgress = false;
        // clients that are partaking in garbage collection, maps ClientIDs to their index in the StatusChecker
        Dictionary<int, int> garbageRoster = new();
        StatusChecker garbageRosterChecker; // StatusChecker for the garbageRoster
        int? GCOldestMessageNumber = null;

        Task lastTask = Task.CompletedTask;

        // callback used to save the document (so that all IO operations are executed in workspaces)
        Action<int, List<string>> SaveDocumentCallback;


        public int ClientCount { get { return clients.Count; } }
        public int DocumentID { get { return documentFile.ID; } }

        public DocumentInstance(Document documentFile, List<string> document, Action<int, List<string>> SaveDocumentCallback)
        {
            this.documentFile = documentFile;
            Document = document;

            this.SaveDocumentCallback = SaveDocumentCallback;

            // initialize a default StatusChecker
            garbageRosterChecker = new StatusChecker(0, GC);
        }

        public void ScheduleAction(Action action)
        {   
            ///TODO: can there be a race condition here?
            lastTask = lastTask.ContinueWith((prevTask) => action()); 
        }

        public bool ClientPresent(int clientID)
        {
            return clients.ContainsKey(clientID);
        }

        bool ClientCanEdit(Client client)
        {
            if (client == null)
            {
                Console.WriteLine($"Error in {nameof(ClientCanEdit)}: client is null.");
                return false;
            }

            if (!RoleHandler.CanEdit(client.Role))
            {
                Console.WriteLine($"Error in {nameof(ClientCanEdit)}: client {client.ID} has insufficient rights.");
                return false;
            }

            if (!ClientPresent(client.ID))
            {
                Console.WriteLine($"Error in {nameof(ClientCanEdit)}: client {client.ID} requested to edit a document with which he is not registered.");
                return false;
            }

            return true;
        }

        public void AddClient(Client client)
        {
            if (clients.ContainsKey(client.ID))
            {
                Console.WriteLine($"Error: Adding already present client to ${nameof(DocumentInstance)}");
                return;
            }

            clients.Add(client.ID, client);

            var initMsg = new InitDocumentMessage(Document, documentFile.ID, wHB, serverOrdering, firstSOMessageNumber);
            client.ClientInterface.Send(initMsg);
        }

        public void RemoveConnection(Client client)
        {
            if (!clients.ContainsKey(client.ID))
            {
                Console.WriteLine($"Error in {nameof(RemoveConnection)}: client {client.ID} cannot be removed from the document.");
                return;
            }

            clients.Remove(client.ID);
        }

        /// <summary>
        /// Prepares the instance for deletion.
        /// Removes references to all clients and clears the state of GC.
        /// </summary>
        public void Delete()
        {
            clients = new();
            ResetGCState();
        }

        public bool HandleOperation(Client client, Operation operation)
        {
            if (!ClientCanEdit(client))
            {
                Console.WriteLine($"Error: {nameof(HandleOperation)}: Operation application failed.");
                return false;
            }

            var message = new OperationMessage(operation, documentFile.ID);

            clients.SendMessage(message);
            ProcessOperation(operation);
            StartGC();

            return true;
        }

        public bool HandleCloseDocument(Client client)
        {
            if (client.OpenDocuments.ContainsKey(DocumentID))
            {
                client.OpenDocuments.Remove(DocumentID);

                RemoveConnection(client);

                // save the document is all clients left
                if (ClientCount == 0)
                    SaveDocumentCallback(DocumentID, new List<string>(Document));

                return true;
            }

            Console.WriteLine($"Error: {nameof(HandleCloseDocument)}: A client ({client.ID}) is closing an unopened document ({DocumentID}).");
            return false;
        }

        void ProcessOperation(Operation operation)
        {
            var (newDocument, wNewHB) = operation.UDR(Document, wHB, serverOrdering);
            serverOrdering.Add(operation.Metadata);
            wHB = wNewHB;
            Document = newDocument;
        }

        /// <summary>
        /// Starts the garbage collection process after enough calls. Sends a message to clients
        /// prompting them to send metadata needed for the GC process.
        /// </summary>
        void StartGC()
        {
            garbageCount++;
            if (garbageCount >= garbageMax && !GCInProgress)
            {
                GCInProgress = true;

                // reset the oldest message number so a new can be selected
                GCOldestMessageNumber = null;

                var message = new GCMetadataRequestMessage(documentFile.ID);

                // clean up the garbage roster and fill it with current clients
                garbageRoster.Clear();
                int currentRosterIndex = 0;
                foreach (var (clientID, client) in clients)
                    garbageRoster.Add(clientID, currentRosterIndex++);

                garbageRosterChecker.Reset(garbageRoster.Count);

                // send the message to each client
                foreach (var (clientID, rosterIndex) in garbageRoster)
                    clients[clientID].ClientInterface.Send(message);

                garbageCount = 0;
                ///TODO: update document file (but preferably do it somewhere else)
            }
        }

        public void HandleGCMetadata(Client client, int dependency)
        {
            if (GCOldestMessageNumber == null || dependency < GCOldestMessageNumber)
                GCOldestMessageNumber = dependency;

            if (!garbageRoster.ContainsKey(client.ID))
            {
                Console.WriteLine("Error: ProcessGCResponse: Invalid ClientID.");
                return;
            }

            int rosterIndex = garbageRoster[client.ID];
            try
            {
                garbageRosterChecker.Check(rosterIndex);
            }
            catch (ArgumentException e)
            {
                Console.WriteLine(e.Message);
            }
            catch (InvalidOperationException e)
            {
                Console.WriteLine(e.Message);
            }
        }

        void GCRemove(int SOGarbageIndex)
        {
            if (SOGarbageIndex < 0 || SOGarbageIndex >= serverOrdering.Count)
            {
                Console.WriteLine($"Error: {nameof(GCRemove)}: The SOGarbageIndex is outside the bounds of SO.");
                return;
            }

            // find matching elements in HB to those in SO
            HashSet<int> HBRemovalIndices = new();
            for (int SOIndex = 0; SOIndex < SOGarbageIndex; SOIndex++)
            {
                int GCClientID = serverOrdering[SOIndex].ClientID;
                int GCCommitSerialNumber = serverOrdering[SOIndex].CommitSerialNumber;
                for (int HBIndex = 0; HBIndex < wHB.Count; HBIndex++)
                {
                    int HBClientID = wHB[HBIndex].Metadata.ClientID;
                    int HBCommitSerialNumber = wHB[HBIndex].Metadata.CommitSerialNumber;
                    if (HBClientID == GCClientID && HBCommitSerialNumber == GCCommitSerialNumber)
                    {
                        HBRemovalIndices.Add(HBIndex);
                        break;
                    }
                }
            }

            // filter out all the GC'd operations
            List<WrappedOperation> wNewHB = new();
            for (int i = 0; i < wHB.Count; i++)
            {
                if (!HBRemovalIndices.Contains(i))
                    wNewHB.Add(wHB[i]);
            }

            serverOrdering = serverOrdering.GetRange(SOGarbageIndex, serverOrdering.Count - SOGarbageIndex);
            wHB = wNewHB;
        }

        void GC()
        {
            // some client has no garbage, abort the operation
            ///TODO: this value should be constant
            if (GCOldestMessageNumber == null || GCOldestMessageNumber == -1)
            {
                ResetGCState();
                return;
            }

            // need to subtract this.firstSOMessageNumber,
            //    because that is how many SO entries from the beginning are missing
            int SOGarbageIndex = GCOldestMessageNumber.Value - firstSOMessageNumber;
            GCRemove(SOGarbageIndex);

            // filter out all the GC'd operations
            firstSOMessageNumber += SOGarbageIndex;

            var message = new GCMessage(documentFile.ID, GCOldestMessageNumber.Value);
            foreach (var (clientID, _) in garbageRoster)
            {
                if (clients.TryGetValue(clientID, out var client))
                {
                    client.ClientInterface.Send(message);
                }
            }

            ResetGCState();
        }

        void ResetGCState()
        {
            garbageRoster.Clear();
            GCInProgress = false;
            GCOldestMessageNumber = null;
        }
    }
}
