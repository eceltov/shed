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
using WebSocketServer.MessageProcessing.ServerMessages;
using WebSocketServer.Parsers.DatabaseParsers;
using WebSocketServer.Parsers.MessageParsers;
using WebSocketServer.Utilities;

namespace WebSocketServer.Model
{
    ///TODO: make all the variables concurrent (especially the GC ones)
    internal class DocumentInstance
    {
        // Maps client IDs to Client instances.
        ///TODO: this should be concurrent
        ConcurrentDictionary<int, Client> clients = new();

        Document documentFile;

        // attributes for document maintenance
        public List<string> Document { get; private set; } = new();
        List<WrappedOperation> wHB = new();
        List<OperationMetadata> serverOrdering = new();

        // attributes for garbage collection

        // the total serial number of the first SO entry
        // does not need to be concurrent, as it is only changed in GC()
        int firstSOMessageNumber = 0;

        // current amount of messages since last GC
        // does not need to be concurrent, as it is changed in the Text Operation Task queue
        int garbageCount = 0;

        ///TODO: set this value in the configuration
        // after how many messages to GC
        int garbageMax = 5;

        bool GCInProgress = false;
        // clients that are partaking in garbage collection, maps ClientIDs to their index in the StatusChecker
        Dictionary<int, int> garbageRoster = new();
        StatusChecker garbageRosterChecker; // StatusChecker for the garbageRoster

        // GCOldestMessageNumber is the SO index of the last operation that can be GC'd
        const int NoGarbageGCOldestMessageNumber = -1;
        const int UninitializedGCOldestMessageNumber = -2;
        int GCOldestMessageNumber = UninitializedGCOldestMessageNumber;

        Task lastTextOperationTask = Task.CompletedTask;

        // callback used to save the document (so that all IO operations are executed in workspaces)
        Action<List<string>> SaveDocumentCallback;

        public int ClientCount { get { return clients.Count; } }
        public int DocumentID { get { return documentFile.ID; } }

        public DocumentInstance(Document documentFile, List<string> document, Action<List<string>> SaveDocumentCallback)
        {
            this.documentFile = documentFile;
            Document = document;

            this.SaveDocumentCallback = SaveDocumentCallback;

            // initialize a default StatusChecker
            garbageRosterChecker = new StatusChecker(0, GC);
        }

        public void ScheduleAddClient(Client client)
        {
            Task.Run(() => AddClient(client));
        }

        public void ScheduleRemoveConnection(Client client)
        {
            Task.Run(() => RemoveConnection(client));
        }

        public void ScheduleClientClosedDocument(Client client)
        {
            Task.Run(() => HandleClientClosedDocument(client));
        }

        public void ScheduleGCMetadata(Client client, int dependency)
        {
            Task.Run(() => HandleGCMetadata(client, dependency));
        }

        public void ScheduleOperation(Client authoringClient, Operation operation)
        {
            ScheduleTextOperationAction(() => HandleOperation(authoringClient, operation));
        }

        public bool ClientPresent(int clientID)
        {
            return clients.ContainsKey(clientID);
        }

        ///TODO: make this concurrent, it should abort all other activities
        /// <summary>
        /// Prepares the instance for deletion.
        /// Removes references to all clients and clears the state of GC.
        /// </summary>
        public void Delete()
        {
            clients = new();
            ResetGCState();
        }

        void ScheduleGCRemove(int SOGarbageIndex)
        {
            ScheduleTextOperationAction(() => GCRemove(SOGarbageIndex));
        }

        /// <summary>
        /// Schedules Text Operation actions that cannot run in parallel.
        /// </summary>
        /// <param name="action">The Text Operation action to be executed.</param>
        void ScheduleTextOperationAction(Action action)
        {   
            ///TODO: can there be a race condition here?
            lastTextOperationTask = lastTextOperationTask.ContinueWith((prevTask) => action()); 
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

        void AddClient(Client client)
        {
            if (clients.ContainsKey(client.ID) || !clients.TryAdd(client.ID, client))
            {
                Console.WriteLine($"Error in {nameof(AddClient)}: Adding already present client to ${nameof(DocumentInstance)}.");
                return;
            }

            var initMsg = new InitDocumentMessage(Document, documentFile.ID, wHB, serverOrdering, firstSOMessageNumber);
            client.ClientInterface.Send(initMsg);
        }

        ///TODO: handle changes in GC active clients
        void RemoveConnection(Client client)
        {
            if (!clients.ContainsKey(client.ID))
            {
                Console.WriteLine($"Error in {nameof(RemoveConnection)}: Client {client.ID} cannot be removed from the document, because it is not present.");
                return;
            }

            if (!clients.TryRemove(client.ID, out Client? _))
            {
                Console.WriteLine($"Error in {nameof(RemoveConnection)}: Client {client.ID} cannot be removed from the document.");
                return;
            }

            // save the document if all clients left
            if (ClientCount == 0)
                SaveDocumentCallback(new List<string>(Document));
        }

        bool HandleOperation(Client authoringClient, Operation operation)
        {
            if (!ClientCanEdit(authoringClient))
            {
                Console.WriteLine($"Error: {nameof(HandleOperation)}: Operation application failed.");
                return false;
            }

            var message = new OperationMessage(operation, documentFile.ID);

            clients.SendMessage(message);
            ApplyOperation(operation);
            StartGC();

            return true;
        }

        bool HandleClientClosedDocument(Client client)
        {
            if (client.OpenDocuments.ContainsKey(DocumentID))
            {
                client.OpenDocuments.TryRemove(DocumentID, out DocumentInstance _);

                RemoveConnection(client);

                return true;
            }

            Console.WriteLine($"Error: {nameof(HandleClientClosedDocument)}: A client ({client.ID}) is closing an unopened document ({DocumentID}).");
            return false;
        }

        /// <summary>
        /// Applies a received operation to the document, HB and SO.
        /// This method cannot be run concurrently with GCRemove, as both modify the HB and SO.
        /// </summary>
        /// <param name="operation">The operation to be applied.</param>
        void ApplyOperation(Operation operation)
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
                GCOldestMessageNumber = UninitializedGCOldestMessageNumber;

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

        void HandleGCMetadata(Client client, int dependency)
        {
            // only update the GCOldestMessageNumber if the client has some garbage
            if (dependency >= 0)
            {
                // set the GCOldestMessageNumber in case it is uninitialized
                bool wasUninitialized = UninitializedGCOldestMessageNumber == Interlocked.CompareExchange(
                    ref GCOldestMessageNumber, dependency, UninitializedGCOldestMessageNumber);

                // in case it was not uninitialized, check whether the dependency is less and update it if so
                int initialValue;
                do
                {
                    initialValue = GCOldestMessageNumber;
                    if (wasUninitialized || dependency >= initialValue)
                        break;
                }
                while (initialValue != Interlocked.CompareExchange(ref GCOldestMessageNumber, dependency, initialValue));
            }


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

        /// <summary>
        /// Removes all SO and HB entries that match SO entries up to (not including) a specified index.
        /// This method cannot be run concurrently with ApplyOperation, as both modify the HB and SO.
        /// </summary>
        /// <param name="SOGarbageIndex">The index that specifies which entries should be removed.</param>
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
            if (GCOldestMessageNumber == UninitializedGCOldestMessageNumber
                || GCOldestMessageNumber == NoGarbageGCOldestMessageNumber)
            {
                ResetGCState();
                return;
            }

            // need to subtract this.firstSOMessageNumber,
            //    because that is how many SO entries from the beginning are missing
            int SOGarbageIndex = GCOldestMessageNumber - firstSOMessageNumber;
            ScheduleGCRemove(SOGarbageIndex);

            // filter out all the GC'd operations
            firstSOMessageNumber += SOGarbageIndex;

            var message = new GCMessage(documentFile.ID, GCOldestMessageNumber);
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
            GCOldestMessageNumber = UninitializedGCOldestMessageNumber;
        }
    }
}
