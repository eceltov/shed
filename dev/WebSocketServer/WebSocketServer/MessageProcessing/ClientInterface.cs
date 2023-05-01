using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.Data;
using WebSocketServer.Extensions;
using WebSocketServer.MessageProcessing.ServerMessages;
using WebSocketServer.Model;
using WebSocketServer.Parsers.MessageParsers;
using WebSocketSharp;
using WebSocketSharp.Server;

namespace WebSocketServer.MessageProcessing
{
    internal class ClientInterface : WebSocketBehavior
    {
        Client? client = null;

        protected override void OnMessage(MessageEventArgs e)
        {
            Console.WriteLine(e.Data);
            HandleMessageAsync(e.Data).GetAwaiter().GetResult();
        }

        ///TODO: this should not be public
        public async Task HandleMessageAsync(string messageString)
        {
            // only an operation uses JSON arrays
            if (messageString[0] == '[')
            {
                HandleOperation(messageString);
                return;
            }

            var genericMessage = new ClientMessage(messageString);
            switch (genericMessage.MsgType)
            {
                case ClientMessageTypes.Connect:
                    await HandleConnectAsync(messageString);
                    break;
                case ClientMessageTypes.GetDocument:
                    HandleGetDocument(messageString);
                    break;
                case ClientMessageTypes.CreateDocument:
                    HandleCreateDocument(messageString);
                    break;
                case ClientMessageTypes.CreateFolder:
                    HandleCreateFolder(messageString);
                    break;
                case ClientMessageTypes.DeleteDocument:
                    HandleDeleteDocument(messageString);
                    break;
                case ClientMessageTypes.DeleteFolder:
                    HandleDeleteFolder(messageString);
                    break;
                case ClientMessageTypes.RenameFile:
                    HandleRenameFile(messageString);
                    break;
                case ClientMessageTypes.GCMetadataResponse:
                    HandleGCMetadata(messageString);
                    break;
                case ClientMessageTypes.CloseDocument:
                    HandleCloseDocument(messageString);
                    break;
                case ClientMessageTypes.ForceDocument:
                    HandleForceDocument(messageString);
                    break;
                case ClientMessageTypes.AddUserToWorkspace:
                    HandleAddUserToWorkspace(messageString);
                    break;
                default:
                    Console.WriteLine($"Received unknown message type: {genericMessage.MsgType}");
                    break;
            }
        }

        async Task HandleConnectAsync(string messageString)
        {
            var message = new ClientConnectMessage(messageString);

            if (await AllWorkspaces.GetWorkspaceAsync(message.WorkspaceHash) is not Workspace workspace)
                return;

            string? userID = ConnectionAuthenticator.ValidateJWT(message);

            // if the workspace does not allow everyone to join, validate the JWT
            if (workspace.Config.AccessType == WorkspaceAccessTypes.Priviledged && userID == null)
                return;

            if (await Client.CreateClientAsync(userID, workspace, this) is not Client newClient)
                return;

            client = newClient;
            if (!AllClients.Add(client)) return;

            Console.WriteLine($"Added client {client.ID}");
            workspace.ScheduleAction(() => workspace.HandleConnectClient(client));
        }

        void HandleGetDocument(string messageString)
        {
            if (client == null)
                return;

            var message = new ClientGetDocumentMessage(messageString);
            client.Workspace.ScheduleAction(async () => await client.Workspace.HandleGetDocumentAsync(client, message.FileID));

        }

        void HandleCreateDocument(string messageString)
        {
            if (client == null)
                return;

            var message = new ClientCreateDocumentMessage(messageString);
            client.Workspace.ScheduleAction(async () => await client.Workspace.HandleCreateDocumentAsync(client, message.ParentID, message.Name));
        }

        void HandleCreateFolder(string messageString)
        {
            if (client == null)
                return;

            var message = new ClientCreateFolderMessage(messageString);
            client.Workspace.ScheduleAction(async () => await client.Workspace.HandleCreateFolderAsync(client, message.ParentID, message.Name));
        }

        void HandleDeleteDocument(string messageString)
        {
            if (client == null)
                return;

            var message = new ClientDeleteDocumentMessage(messageString);
            client.Workspace.ScheduleAction(async () => await client.Workspace.HandleDeleteDocumentAsync(client, message.FileID));
        }

        void HandleDeleteFolder(string messageString)
        {
            if (client == null)
                return;

            var message = new ClientDeleteFolderMessage(messageString);
            client.Workspace.ScheduleAction(async () => await client.Workspace.HandleDeleteFolderAsync(client, message.FileID));
        }

        void HandleRenameFile(string messageString)
        {
            if (client == null)
                return;

            var message = new ClientRenameFileMessage(messageString);
            client.Workspace.ScheduleAction(async () => await client.Workspace.HandleRenameFileAsync(client, message.FileID, message.Name));
        }

        void HandleCloseDocument(string messageString)
        {
            if (client == null)
                return;

            var message = new ClientCloseDocumentMessage(messageString);
            client.Workspace.ScheduleDocumentAction(message.DocumentID, (documentInstance) => documentInstance.ScheduleClientClosedDocument(client));
        }

        void HandleOperation(string messageString)
        {
            if (client == null)
                return;

            var message = new ClientOperationMessage(messageString);
            client.Workspace.ScheduleDocumentAction(message.DocumentID, (documentInstance) => documentInstance.ScheduleOperation(client, message.Operation));
        }

        void HandleGCMetadata(string messageString)
        {
            if (client == null)
                return;

            var message = new ClientGCMetadataMessage(messageString);
            client.Workspace.ScheduleDocumentAction(message.DocumentID, (documentInstance) => documentInstance.ScheduleGCMetadata(client, message.Dependency));
        }

        void HandleForceDocument(string messageString)
        {
            if (client == null)
                return;

            var message = new ClientForceDocumentMessage(messageString);
            client.Workspace.ScheduleDocumentAction(message.DocumentID, (documentInstance) => documentInstance.ScheduleForceDocument(client, message.Document));
        }

        void HandleAddUserToWorkspace(string messageString)
        {
            if (client == null)
                return;

            var message = new ClientAddUserToWorkspacetMessage(messageString);
            client.Workspace.ScheduleAction(async () => await client.Workspace.HandleAddUserToWorkspaceAsync(client, message.Username, message.Role));
        }

        protected override void OnClose(CloseEventArgs e)
        {
            if (client != null)
            {
                client.Workspace.RemoveConnection(client);
                AllClients.Remove(client);
            }


            Console.WriteLine($"Connection closed (client ID {client?.ID})");
            base.OnClose(e);
        }

        public void Send(object message)
        {
            base.Send(JsonConvert.SerializeObject(message));
        }
    }
}
