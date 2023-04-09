﻿using Newtonsoft.Json;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;
using WebSocketServer.Data;
using WebSocketServer.MessageProcessing;
using WebSocketServer.Parsers.DatabaseParsers;
using WebSocketServer.Extensions;
using TextOperations.Types;
using System.Text.RegularExpressions;

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
        /// one client.
        /// </summary>
        public Dictionary<int, DocumentInstance> ActiveDocuments { get; private set; }

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

        public bool ScheduleDocumentAction(int documentID, Action<DocumentInstance> action)
        {
            ///TODO: accessing ActiveDocuments is not thread safe
            if (ActiveDocuments.TryGetValue(documentID, out DocumentInstance? documentInstance) && documentInstance != null)
            {
                documentInstance.ScheduleAction(() => action(documentInstance));
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

        static List<string>? GetDocumentContent(string workspaceID, string absolutePath)
        {
            try
            {
                string contentString = DatabaseProvider.Database.GetDocumentData(workspaceID, absolutePath);
                return Regex.Split(contentString, "\r\n|\r|\n").ToList();
            }
            catch
            {
                return null;
            }
        }

        void SaveDocument(int documentID, List<string> document)
        {
            string? absolutePath = FileStructure.GetAbsolutePath(documentID);

            if (absolutePath == null)
            {
                Console.WriteLine($"Error in {nameof(SaveDocument)}: Absolute path is null (documentID {documentID}).");
                return;
            }

            if (DatabaseProvider.Database.WriteDocumentData(ID, absolutePath, document))
            {
                Console.WriteLine($"Error in {nameof(SaveDocument)}: Could not save document (path {absolutePath}).");
                return;
            }
        }

        DocumentInstance? StartDocument(int fileID)
        {
            if (ActiveDocuments.ContainsKey(fileID))
            {
                Console.WriteLine($"Error in {nameof(StartDocument)}: Attempted to start already active document (ID {fileID}).");
                return null;
            }

            if (FileStructure.GetFileFromID(fileID) is not Document documentFile)
            {
                Console.WriteLine($"Error in {nameof(StartDocument)}: Attempted to start invalid document (ID {fileID}).");
                return null;
            }

            string? documentPath = FileStructure.GetAbsolutePath(fileID);
            if (documentPath == null) return null;

            if (GetDocumentContent(ID, documentPath) is not List<string> document)
            {
                Console.WriteLine($"Error in {nameof(StartDocument)}: Could not read document content (path {documentPath}).");
                return null;
            }

            DocumentInstance documentInstance = new(documentFile, document, SaveDocument);
            ActiveDocuments.Add(fileID, documentInstance);
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

            string absolutePath = FileStructure.GetAbsolutePath(document.ID)!;
            if (!DatabaseProvider.Database.CreateDocument(ID, absolutePath))
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

            string absolutePath = FileStructure.GetAbsolutePath(folder.ID)!;
            if (!DatabaseProvider.Database.CreateFolder(ID, absolutePath))
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

            if (FileStructure.GetAbsolutePath(fileID) is not string absolutePath)
                return false;

            if (!FileStructure.RemoveFile(fileID))
                return false;

            // close document
            if (ActiveDocuments.ContainsKey(fileID))
            {
                DocumentInstance documentInstance = ActiveDocuments[fileID];
                documentInstance.Delete();
                ActiveDocuments.Remove(fileID);

                // remove document reference from clients
                foreach (var (clientID, connectedClient) in Clients)
                {
                    connectedClient.OpenDocuments.Remove(clientID);
                }
            }

            if (!DatabaseProvider.Database.DeleteDocument(ID, absolutePath))
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

            if (FileStructure.GetAbsolutePath(fileID) is not string absolutePath)
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

            if (!DatabaseProvider.Database.DeleteFolder(ID, absolutePath))
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

            if (FileStructure.GetAbsolutePath(fileID) is not string oldPath)
                return false;

            if (!FileStructure.RenameFile(fileID, newName))
                return false;

            if (FileStructure.GetAbsolutePath(fileID) is not string newPath)
                return false;

            if (!DatabaseProvider.Database.RenameFile(ID, oldPath, newPath))
            {
                ///TODO: retry it later
            }

            return true;
        }

        public bool HandleConnectClient(Client client)
        {
            if (!ClientCanJoin(client))
                return false;

            Clients.Add(client.ID, client);
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

        public bool HandleGCMetadata(Client client, int documentID, int dependency)
        {
            ///TODO: unsafe, plus possible race condition
            ActiveDocuments[documentID].HandleGCMetadata(client, dependency);
            return true;
        }

        ///TODO: save after all clients left
        void SaveFileStructure()
        {
            DatabaseProvider.Database.UpdateFileStructure(ID, FileStructure);
        }
    }
}
