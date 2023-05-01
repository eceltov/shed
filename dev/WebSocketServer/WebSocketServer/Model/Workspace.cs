﻿using Newtonsoft.Json;
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
using System.Runtime.InteropServices;

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

        public Workspace(string ID, string name, FileStructure fileStructure, WorkspaceUsers users)
        {
            Console.WriteLine($"Creating Workspace {name}, ID {ID}");
            this.ID = ID;
            Name = name;
            FileStructure = fileStructure;
            Users = users;
            Clients = new();
            ActiveDocuments = new();
        }

        public void ScheduleAction(Action action)
        {
            Task.Run(() => action());
        }

        public bool ScheduleDocumentAction(int documentID, Action<DocumentInstance> documentAction)
        {
            if (ActiveDocuments.TryGetValue(documentID, out DocumentInstance? documentInstance) && documentInstance != null)
            {
                documentAction(documentInstance);
                return true;
            }

            Console.WriteLine($"Error in {nameof(ScheduleDocumentAction)}: Could not schedule document action.");
            return false;
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

        async Task<bool> ConnectClientToDocumentAsync(Client client, int fileID)
        {
            if (!RoleHandler.CanView(client.Role))
                return false;

            DocumentInstance documentInstance;

            if (!ActiveDocuments.ContainsKey(fileID))
            {
                if (await StartDocumentAsync(fileID) is DocumentInstance newDocument)
                {
                    documentInstance = newDocument;
                }
                else
                {
                    // the document could not be instantiated
                    /// TODO: send an error message
                    Console.WriteLine($"Error in {nameof(ConnectClientToDocumentAsync)}: DocumentInstance could not be started.");
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
                Console.WriteLine($"Error in {nameof(ConnectClientToDocumentAsync)}: Connecting client to a document when already connected.");
                return false;
            }

            if (!client.OpenDocuments.TryAdd(fileID, documentInstance))
            {
                Console.WriteLine($"Error in {nameof(ConnectClientToDocumentAsync)}: Could not add new open document to client.");
                return false;
            }

            documentInstance.ScheduleAddClient(client);

            return true;
        }

        static async Task<List<string>?> GetDocumentContentAsync(string workspaceID, string relativePath)
        {
            try
            {
                string contentString = await DatabaseProvider.Database.GetDocumentDataAsync(workspaceID, relativePath);
                return Regex.Split(contentString, "\r\n|\r|\n").ToList();
            }
            catch
            {
                return null;
            }
        }

        async Task SaveDocumentAsync(int documentID, List<string> document)
        {
            string? relativePath = FileStructure.GetRelativePath(documentID);

            if (relativePath == null)
            {
                Console.WriteLine($"Error in {nameof(SaveDocumentAsync)}: Relative path is null (documentID {documentID}).");
                return;
            }

            if (!await DatabaseProvider.Database.WriteDocumentDataAsync(ID, relativePath, document))
            {
                Console.WriteLine($"Error in {nameof(SaveDocumentAsync)}: Could not save document (path {relativePath}).");
                return;
            }
        }

        async Task<DocumentInstance?> StartDocumentAsync(int documentID)
        {
            if (ActiveDocuments.ContainsKey(documentID))
            {
                Console.WriteLine($"Error in {nameof(StartDocumentAsync)}: Attempted to start already active document (ID {documentID}).");
                return null;
            }

            if (FileStructure.GetFileFromID(documentID) is not Document documentFile)
            {
                Console.WriteLine($"Error in {nameof(StartDocumentAsync)}: Attempted to start invalid document (ID {documentID}).");
                return null;
            }

            string? documentPath = FileStructure.GetRelativePath(documentID);
            if (documentPath == null) return null;

            if (await GetDocumentContentAsync(ID, documentPath) is not List<string> document)
            {
                Console.WriteLine($"Error in {nameof(StartDocumentAsync)}: Could not read document content (path {documentPath}).");
                return null;
            }

            Action<List<string>> SaveDocumentCallback = (documentContent) => ScheduleAction(async () => await SaveDocumentAsync(documentID, documentContent));

            DocumentInstance documentInstance = new(documentFile, document, SaveDocumentCallback);
            if (!ActiveDocuments.TryAdd(documentID, documentInstance))
            {
                Console.WriteLine($"Error in {nameof(StartDocumentAsync)}: Could not add document to ActiveDocuments.");
                return null;
            }
            return documentInstance;
        }

        async Task<int?> CreateDocumentAsync(Client client, int parentID, string name)
        {
            if (!FileStructure.ValidateFileName(name))
                return null;

            if (!RoleHandler.CanManageFiles(client.Role))
                return null;

            Document document = new(FileStructure.NextID++, name);
            if (!FileStructure.AddFile(parentID, document))
                return null;

            string relativePath = FileStructure.GetRelativePath(document.ID)!;
            if (!await DatabaseProvider.Database.CreateDocumentAsync(ID, relativePath))
            {
                FileStructure.RemoveFile(document.ID);
                return null;
            }

            return document.ID;
        }

        async Task<int?> CreateFolderAsync(Client client, int parentID, string name)
        {
            if (!FileStructure.ValidateFileName(name))
                return null;

            if (!RoleHandler.CanManageFiles(client.Role))
                return null;

            Folder folder = new(FileStructure.NextID++, name);
            if (!FileStructure.AddFile(parentID, folder))
                return null;

            string relativePath = FileStructure.GetRelativePath(folder.ID)!;
            if (!await DatabaseProvider.Database.CreateFolderAsync(ID, relativePath))
            {
                FileStructure.RemoveFile(folder.ID);
                return null;
            }

            return folder.ID;
        }

        async Task<bool> DeleteDocumentAsync(Client client, int fileID)
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

            if (!await DatabaseProvider.Database.DeleteDocumentAsync(ID, relativePath))
            {
                ///TODO: retry it later
            }

            return true;
        }

        async Task<bool> DeleteFolderAsync(Client client, int fileID)
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
                    await DeleteDocumentAsync(client, file.ID);
                else if (file.Type == FileTypes.Folder)
                    await DeleteFolderAsync(client, file.ID);
            }

            if (!FileStructure.RemoveFile(fileID))
                return false;

            if (!await DatabaseProvider.Database.DeleteFolderAsync(ID, relativePath))
            {
                ///TODO: retry it later
            }

            return true;
        }

        async Task<bool> RenameFileAsync(Client client, int fileID, string newName)
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

            if (!await DatabaseProvider.Database.RenameFileAsync(ID, oldPath, newPath))
            {
                Console.WriteLine($"Error in {nameof(RenameFileAsync)}: Database could not rename file.");
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

        public async Task<bool> HandleGetDocumentAsync(Client client, int fileID)
        {
            if (FileStructure.IsDocument(fileID))
            {
                await ConnectClientToDocumentAsync(client, fileID);
                return true;
            }

            return false;
        }

        public async Task<bool> HandleCreateDocumentAsync(Client client, int parentID, string name)
        {
            if (await CreateDocumentAsync(client, parentID, name) is not int documentID)
            {
                Console.WriteLine($"Error in {nameof(HandleCreateDocumentAsync)}: Document creation failed.");
                return false;
            }

            CreateDocumentMessage message = new(parentID, documentID, name);
            Clients.SendMessage(message);
            await SaveFileStructureAsync();
            return true;
        }

        public async Task<bool> HandleCreateFolderAsync(Client client, int parentID, string name)
        {
            if (await CreateFolderAsync(client, parentID, name) is not int folderID)
            {
                Console.WriteLine($"Error in {nameof(HandleCreateFolderAsync)}: Folder creation failed.");
                return false;
            }

            CreateFolderMessage message = new(parentID, folderID, name);
            Clients.SendMessage(message);
            await SaveFileStructureAsync();
            return true;
        }

        public async Task<bool> HandleDeleteDocumentAsync(Client client, int fileID)
        {
            if (!await DeleteDocumentAsync(client, fileID))
            {
                Console.WriteLine($"Error in {nameof(HandleDeleteDocumentAsync)}: Document deletion failed.");
                return false;
            }

            DeleteDocumentMessage message = new(fileID);
            Clients.SendMessage(message);
            await SaveFileStructureAsync();
            return true;
        }

        public async Task<bool> HandleDeleteFolderAsync(Client client, int fileID)
        {
            if (!await DeleteFolderAsync(client, fileID))
            {
                Console.WriteLine($"Error in {nameof(HandleDeleteFolderAsync)}: Folder deletion failed.");
                return false;
            }

            DeleteFolderMessage message = new(fileID);
            Clients.SendMessage(message);
            await SaveFileStructureAsync();
            return true;
        }

        public async Task<bool> HandleRenameFileAsync(Client client, int fileID, string newName)
        {
            if (!await RenameFileAsync(client, fileID, newName))
            {
                Console.WriteLine($"Error in {nameof(HandleRenameFileAsync)}: File rename failed.");
                return false;
            }

            RenameFileMessage message = new(fileID, newName);
            Clients.SendMessage(message);
            await SaveFileStructureAsync();
            return true;
        }

        /// <summary>
        /// Validates the username.
        /// Only alphanumeric characters are allowed.
        /// </summary>
        /// <param name="username">The username to validate.</param>
        /// <returns>Returns whether the username is valid.</returns>
        bool ValidateUsername(string username)
        {
            return username.All(char.IsLetterOrDigit);
        }

        /// <summary>
        /// Adds a user to a workspace if its username and role are valid and the
        /// one to add the user is priviledged to do so.
        /// If already present, its role is updated instead.
        /// </summary>
        /// <param name="client">The client that wishes to add a user.</param>
        /// <param name="username">The username of the added user.</param>
        /// <param name="role">The role of the added user.</param>
        /// <returns></returns>
        public async Task<bool> HandleAddUserToWorkspaceAsync(Client client, string username, Roles role)
        {
            if (!RoleHandler.CanAddUsers(client.Role))
            {
                Console.WriteLine($"Error in {nameof(HandleAddUserToWorkspaceAsync)}: Unpriviledged user tried to add a user.");
                return false;
            }

            if (!ValidateUsername(username))
            {
                Console.WriteLine($"Error in {nameof(HandleAddUserToWorkspaceAsync)}: Invalid username.");
                return false;
            }

            if (!RoleHandler.ValidWorkspaceAdditionRole(role))
            {
                Console.WriteLine($"Error in {nameof(HandleAddUserToWorkspaceAsync)}: Invalid role.");
                return false;
            }

            return await DatabaseProvider.Database.AddUserToWorkspaceAsync(ID, Name, username, role);
        }

        ///TODO: save after all clients left
        async Task<bool> SaveFileStructureAsync()
        {
            return await DatabaseProvider.Database.UpdateFileStructureAsync(ID, FileStructure);
        }

        public void RemoveConnection(Client client)
        {
            foreach (var document in client.OpenDocuments.Values)
                document.ScheduleRemoveConnection(client);

            Clients.TryRemove(client.ID, out Client? _);
        }
    }
}
