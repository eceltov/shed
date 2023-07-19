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
    internal class DocumentInstance
    {
        // Maps client IDs to Client instances.
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

        object lastTextOperationTaskLock = new object();
        Task lastTextOperationTask = Task.CompletedTask;

        // callback used to save the document (so that all IO operations are executed in workspaces)
        Action<List<string>> SaveDocumentCallback = (documentContent) => throw new InvalidOperationException("The SaveDocumentCallback is not initialized.");

        // callback used to check whether a client can make changes to the document
        Predicate<Client> ClientCanEditCallback = (client) => throw new InvalidOperationException("The ClientCanEditCallback is not initialized.");

        public int ClientCount { get { return clients.Count; } }
        public int DocumentID { get { return documentFile.ID; } }

        public DocumentInstance(Document documentFile, List<string> document)
        {
            this.documentFile = documentFile;
            Document = document;

            // initialize a default StatusChecker
            garbageRosterChecker = new StatusChecker(0, GC);
        }

        public void InitializeCallbacks(Action<List<string>> SaveDocumentCallback, Predicate<Client> ClientCanEditCallback)
        {
            this.SaveDocumentCallback = SaveDocumentCallback;
            this.ClientCanEditCallback = ClientCanEditCallback;
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

        public void ScheduleForceDocument(Client client, List<string> document)
        {
            Task.Run(() => HandleForceDocument(client, document));
        }

        public bool ClientPresent(int clientID)
        {
            return clients.ContainsKey(clientID);
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
            lock (lastTextOperationTaskLock)
            {
                lastTextOperationTask = lastTextOperationTask.ContinueWith((prevTask) => action()); 
            }
        }

        void AddClient(Client client)
        {
            if (clients.ContainsKey(client.ID) || !clients.TryAdd(client.ID, client))
            {
                Logger.DebugWriteLine($"Error in {nameof(AddClient)}: Adding already present client to ${nameof(DocumentInstance)}.");
                return;
            }

            var initMsg = new InitDocumentMessage(Document, documentFile.ID, wHB, serverOrdering, firstSOMessageNumber);
            client.ClientInterface.Send(initMsg);
        }

        void RemoveConnection(Client client)
        {
            if (!clients.ContainsKey(client.ID))
            {
                Logger.DebugWriteLine($"Error in {nameof(RemoveConnection)}: Client {client.ID} cannot be removed from the document, because it is not present.");
                return;
            }

            if (!clients.TryRemove(client.ID, out Client? _))
            {
                Logger.DebugWriteLine($"Error in {nameof(RemoveConnection)}: Client {client.ID} cannot be removed from the document.");
                return;
            }

            // save the document if all clients left
            if (ClientCount == 0)
                SaveDocumentCallback(new List<string>(Document));
        }

        bool HandleOperation(Client authoringClient, Operation operation)
        {
            if (!ClientCanEditCallback(authoringClient))
            {
                Logger.DebugWriteLine($"Error: {nameof(HandleOperation)}: Operation application failed.");
                return false;
            }

            var message = new OperationMessage(operation, documentFile.ID);

            clients.SendMessage(message);

            // operation application always succeeds if the concurrency model is correct
            // in case it is not and the application fails, a divergence detection message is sent to the clients
            try
            {
                ApplyOperation(operation);
            }
            catch
            {
                Logger.DebugWriteLine($"Error: {nameof(HandleOperation)}: Document divergence detected.");
                var divergenceMessage = new DivergenceDetectedMessage(DocumentID);
                clients.SendMessage(divergenceMessage);

                return false;
            }

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

            Logger.DebugWriteLine($"Error: {nameof(HandleClientClosedDocument)}: A client ({client.ID}) is closing an unopened document ({DocumentID}).");
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
                Logger.DebugWriteLine("Error: ProcessGCResponse: Invalid ClientID.");
                return;
            }

            int rosterIndex = garbageRoster[client.ID];
            try
            {
                garbageRosterChecker.Check(rosterIndex);
            }
            catch (ArgumentException e)
            {
                Logger.DebugWriteLine(e.Message);
            }
            catch (InvalidOperationException e)
            {
                Logger.DebugWriteLine(e.Message);
            }
        }

        bool HandleForceDocument(Client client, List<string> document)
        {
            if (!ClientCanEditCallback(client))
            {
                Logger.DebugWriteLine($"Error: {nameof(HandleForceDocument)}: Unauthorized client tried to force document.");
                return false;
            }

            // it is assumed that all operations in the queue were already executed, as the client document editor becomes
            // disabled after divergence is detected
            Document = document;
            ResetAllStructures();

            var message = new ForceDocumentMessage(document, DocumentID);
            clients.SendMessage(message);

            return true;
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
                Logger.DebugWriteLine($"Error: {nameof(GCRemove)}: The SOGarbageIndex is outside the bounds of SO.");
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

        /// <summary>
        /// Clears all structures associated with document history.
        /// </summary>
        void ResetAllStructures()
        {
            ResetGCState();
            wHB = new();
            serverOrdering = new();
            firstSOMessageNumber = 0;
            garbageCount = 0;
        }

        void ResetGCState()
        {
            garbageRoster.Clear();
            GCInProgress = false;
            GCOldestMessageNumber = UninitializedGCOldestMessageNumber;
        }
    }
}
