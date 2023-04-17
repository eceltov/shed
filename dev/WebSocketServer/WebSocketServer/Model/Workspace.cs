using Newtonsoft.Json;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;
using WebSocketServer.Data;
using WebSocketServer.Parsers.DatabaseParsers;
using WebSocketServer.Extensions;
using TextOperations.Types;
using System.Text.RegularExpressions;
using WebSocketServer.MessageProcessing.ServerMessages;

namespace WebSocketServer.Model
{
    internal class Workspace
    {
        public FileStructure FileStructure { get; private set; }
        public WorkspaceUsers Users { get; private set; }
        public string Name { get; private set; }
        public string ID { get; private set; }

        ///TODO: this should be concurrent
        /// <summary>
        /// Maps client IDs to Client instances.
        /// </summary>
        public ConcurrentDictionary<int, Client> Clients { get; private set; }

        /// <summary>
        /// Maps document file IDs to active DocumentInstances.
        /// Active documents are those that are currently opened by at least
        /// one client.
        /// </summary>
        public ConcurrentDictionary<int, DocumentInstance> ActiveDocuments { get; private set; }

        readonly BlockingCollection<Action> actions;
        readonly Thread workerThread;


        public Workspace(string ID, string name, FileStructure fileStructure, WorkspaceUsers users)
        {
            Console.WriteLine($"Creating Workspace {name}, ID {ID}");
            this.ID = ID;
            Name = name;
            FileStructure = fileStructure;
            Users = users;
            Clients = new();
            actions = new();
            ActiveDocuments = new();

            workerThread = new Thread(() => ProcessActions(CancellationToken.None));
            workerThread.Start();
        }

        public void ScheduleAction(Action action)
        {
            actions.Add(action);
        }

        public bool ScheduleDocumentAction(int documentID, Action<DocumentInstance> documentAction)
        {
            ///TODO: accessing ActiveDocuments is not thread safe
            if (ActiveDocuments.TryGetValue(documentID, out DocumentInstance? documentInstance) && documentInstance != null)
            {
                documentAction(documentInstance);
                return true;
            }

            Console.WriteLine($"Error in {nameof(ScheduleDocumentAction)}: Could not schedule document action.");
            return false;
        }

        void ProcessActions(CancellationToken cancellationToken)
        {
            foreach (var action in actions.GetConsumingEnumerable(cancellationToken))
            {
                action();
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
                    Console.WriteLine($"Error in {nameof(ConnectClientToDocument)}: DocumentInstance could not be started.");
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
                Console.WriteLine($"Error in {nameof(ConnectClientToDocument)}: Connecting client to a document when already connected.");
                return false;
            }

            if (!client.OpenDocuments.TryAdd(fileID, documentInstance))
            {
                Console.WriteLine($"Error in {nameof(ConnectClientToDocument)}: Could not add new open document to client.");
                return false;
            }

            documentInstance.ScheduleAddClient(client);

            return true;
        }

        static List<string>? GetDocumentContent(string workspaceID, string relativePath)
        {
            try
            {
                string contentString = DatabaseProvider.Database.GetDocumentData(workspaceID, relativePath);
                return Regex.Split(contentString, "\r\n|\r|\n").ToList();
            }
            catch
            {
                return null;
            }
        }

        void SaveDocument(int documentID, List<string> document)
        {
            string? relativePath = FileStructure.GetRelativePath(documentID);

            if (relativePath == null)
            {
                Console.WriteLine($"Error in {nameof(SaveDocument)}: Relative path is null (documentID {documentID}).");
                return;
            }

            if (!DatabaseProvider.Database.WriteDocumentData(ID, relativePath, document))
            {
                Console.WriteLine($"Error in {nameof(SaveDocument)}: Could not save document (path {relativePath}).");
                return;
            }
        }

        DocumentInstance? StartDocument(int documentID)
        {
            if (ActiveDocuments.ContainsKey(documentID))
            {
                Console.WriteLine($"Error in {nameof(StartDocument)}: Attempted to start already active document (ID {documentID}).");
                return null;
            }

            if (FileStructure.GetFileFromID(documentID) is not Document documentFile)
            {
                Console.WriteLine($"Error in {nameof(StartDocument)}: Attempted to start invalid document (ID {documentID}).");
                return null;
            }

            string? documentPath = FileStructure.GetRelativePath(documentID);
            if (documentPath == null) return null;

            if (GetDocumentContent(ID, documentPath) is not List<string> document)
            {
                Console.WriteLine($"Error in {nameof(StartDocument)}: Could not read document content (path {documentPath}).");
                return null;
            }

            Action<List<string>> SaveDocumentCallback = (documentContent) => ScheduleAction(() => SaveDocument(documentID, documentContent));

            DocumentInstance documentInstance = new(documentFile, document, SaveDocumentCallback);
            if (!ActiveDocuments.TryAdd(documentID, documentInstance))
            {
                Console.WriteLine($"Error in {nameof(StartDocument)}: Could not add document to ActiveDocuments.");
                return null;
            }
            return documentInstance;
        }

        int? CreateDocument(Client client, int parentID, string name)
        {
            if (!FileStructure.ValidateFileName(name))
                return null;

            if (!RoleHandler.CanManageFiles(client.Role))
                return null;

            Document document = new(FileStructure.NextID++, name);
            if (!FileStructure.AddFile(parentID, document))
                return null;

            string relativePath = FileStructure.GetRelativePath(document.ID)!;
            if (!DatabaseProvider.Database.CreateDocument(ID, relativePath))
            {
                FileStructure.RemoveFile(document.ID);
                return null;
            }

            return document.ID;
        }

        int? CreateFolder(Client client, int parentID, string name)
        {
            if (!FileStructure.ValidateFileName(name))
                return null;

            if (!RoleHandler.CanManageFiles(client.Role))
                return null;

            Folder folder = new(FileStructure.NextID++, name);
            if (!FileStructure.AddFile(parentID, folder))
                return null;

            string relativePath = FileStructure.GetRelativePath(folder.ID)!;
            if (!DatabaseProvider.Database.CreateFolder(ID, relativePath))
            {
                FileStructure.RemoveFile(folder.ID);
                return null;
            }

            return folder.ID;
        }

        bool DeleteDocument(Client client, int fileID)
        {
            if (!RoleHandler.CanManageFiles(client.Role))
                return false;

            if (FileStructure.GetRelativePath(fileID) is not string relativePath)
                return false;

            if (!FileStructure.RemoveFile(fileID))
                return false;

            // close document
            if (ActiveDocuments.ContainsKey(fileID))
            {
                if (!ActiveDocuments.TryRemove(fileID, out DocumentInstance? documentInstance))
                    return false;

                documentInstance.Delete();

                // remove document reference from clients
                foreach (var (clientID, connectedClient) in Clients)
                {
                    connectedClient.OpenDocuments.TryRemove(fileID, out DocumentInstance _);
                }
            }

            if (!DatabaseProvider.Database.DeleteDocument(ID, relativePath))
            {
                ///TODO: retry it later
            }

            return true;
        }

        bool DeleteFolder(Client client, int fileID)
        {
            if (!RoleHandler.CanManageFiles(client.Role))
                return false;

            if (FileStructure.GetFileFromID(fileID) is not Folder folder)
                return false;

            if (FileStructure.GetRelativePath(fileID) is not string relativePath)
                return false;

            // delete all nested files
            foreach (var (_, file) in folder.Items)
            {
                if (file.Type == FileTypes.Document)
                    DeleteDocument(client, file.ID);
                else if (file.Type == FileTypes.Folder)
                    DeleteFolder(client, file.ID);
            }

            if (!FileStructure.RemoveFile(fileID))
                return false;

            if (!DatabaseProvider.Database.DeleteFolder(ID, relativePath))
            {
                ///TODO: retry it later
            }

            return true;
        }

        bool RenameFile(Client client, int fileID, string newName)
        {
            if (!FileStructure.ValidateFileName(newName))
                return false;

            if (!RoleHandler.CanManageFiles(client.Role))
                return false;

            if (FileStructure.GetRelativePath(fileID) is not string oldPath)
                return false;

            if (!FileStructure.RenameFile(fileID, newName))
                return false;

            if (FileStructure.GetRelativePath(fileID) is not string newPath)
                return false;

            if (!DatabaseProvider.Database.RenameFile(ID, oldPath, newPath))
            {
                ///TODO: retry it later
                return false;
            }

            return true;
        }

        public bool HandleConnectClient(Client client)
        {
            if (!ClientCanJoin(client))
                return false;

            if (!Clients.TryAdd(client.ID, client))
                return false;

            var initMsg = new InitWorkspaceMessage(client.ID, FileStructure, client.Role);
            client.ClientInterface.Send(initMsg);

            return true;
        }

        public bool HandleGetDocument(Client client, int fileID)
        {
            if (FileStructure.IsDocument(fileID))
            {
                ConnectClientToDocument(client, fileID);
                return true;
            }

            return false;
        }

        public bool HandleCreateDocument(Client client, int parentID, string name)
        {
            if (CreateDocument(client, parentID, name) is not int documentID)
            {
                Console.WriteLine("Error: HandleCreateDocument: Document creation failed.");
                return false;
            }

            CreateDocumentMessage message = new(parentID, documentID, name);
            Clients.SendMessage(message);
            SaveFileStructure();
            return true;
        }

        public bool HandleCreateFolder(Client client, int parentID, string name)
        {
            if (CreateFolder(client, parentID, name) is not int folderID)
            {
                Console.WriteLine("Error: HandleCreateFolder: Folder creation failed.");
                return false;
            }

            CreateFolderMessage message = new(parentID, folderID, name);
            Clients.SendMessage(message);
            SaveFileStructure();
            return true;
        }

        public bool HandleDeleteDocument(Client client, int fileID)
        {
            if (!DeleteDocument(client, fileID))
            {
                Console.WriteLine("Error: HandleDeleteDocument: Document deletion failed.");
                return false;
            }

            DeleteDocumentMessage message = new(fileID);
            Clients.SendMessage(message);
            SaveFileStructure();
            return true;
        }

        public bool HandleDeleteFolder(Client client, int fileID)
        {
            if (!DeleteFolder(client, fileID))
            {
                Console.WriteLine("Error: HandleDeleteFolder: Folder deletion failed.");
                return false;
            }

            DeleteFolderMessage message = new(fileID);
            Clients.SendMessage(message);
            SaveFileStructure();
            return true;
        }

        public bool HandleRenameFile(Client client, int fileID, string newName)
        {
            if (!RenameFile(client, fileID, newName))
            {
                Console.WriteLine("Error: HandleRenameFile: File rename failed.");
                return false;
            }

            RenameFileMessage message = new(fileID, newName);
            Clients.SendMessage(message);
            SaveFileStructure();
            return true;
        }

        ///TODO: save after all clients left
        void SaveFileStructure()
        {
            DatabaseProvider.Database.UpdateFileStructure(ID, FileStructure);
        }

        public void RemoveConnection(Client client)
        {
            foreach (var document in client.OpenDocuments.Values)
                document.ScheduleRemoveConnection(client);

            Clients.TryRemove(client.ID, out Client? _);
        }
    }
}
