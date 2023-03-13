using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.Data;
using WebSocketServer.Model;
using WebSocketServer.Model.WorkspaceActionDescriptors;
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
            HandleMessage(e.Data);
        }

        ///TODO: this should not be public
        public void HandleMessage(string messageString)
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
                    HandleConnect(messageString);
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
                default:
                    Console.WriteLine($"Received unknown message type: {genericMessage.MsgType}");
                    break;
            }
        }

        void HandleConnect(string messageString)
        {
            var message = new ClientConnectMessage(messageString);
            string? userID = MessageProcessor.AcceptConnection(message);
            if (userID != null)
            {

                Workspace? workspace = AllWorkspaces.GetWorkspace(message.WorkspaceHash);
                if (workspace == null) return;

                Client? newClient = Client.CreateClient(userID, workspace, this);
                if (newClient == null) return;

                client = newClient;
                AllClients.Add(client);
                Console.WriteLine($"Added client {client.ID}");
                workspace.ScheduleAction(new ConnectClientDescriptor(client));
            }
        }

        void HandleGetDocument(string messageString)
        {
            if (client == null)
                return;

            var message = new ClientGetDocumentMessage(messageString);
            client.Workspace.ScheduleAction(new GetDocumentDescriptor(client, message.FileID));

        }

        void HandleCreateDocument(string messageString)
        {
            if (client == null)
                return;

            var message = new ClientCreateDocumentMessage(messageString);
            client.Workspace.ScheduleAction(new CreateDocumentDescriptor(client, message.ParentID, message.Name));
        }

        void HandleCreateFolder(string messageString)
        {
            if (client == null)
                return;

            var message = new ClientCreateFolderMessage(messageString);
            client.Workspace.ScheduleAction(new CreateFolderDescriptor(client, message.ParentID, message.Name));
        }

        void HandleDeleteDocument(string messageString)
        {
            if (client == null)
                return;

            var message = new ClientDeleteDocumentMessage(messageString);
            client.Workspace.ScheduleAction(new DeleteDocumentDescriptor(client, message.FileID));
        }

        void HandleDeleteFolder(string messageString)
        {
            if (client == null)
                return;

            var message = new ClientDeleteFolderMessage(messageString);
            client.Workspace.ScheduleAction(new DeleteFolderDescriptor(client, message.FileID));
        }

        void HandleRenameFile(string messageString)
        {
            if (client == null)
                return;

            var message = new ClientRenameFileMessage(messageString);
            client.Workspace.ScheduleAction(new RenameFileDescriptor(client, message.FileID, message.Name));
        }

        void HandleCloseDocument(string messageString)
        {
            if (client == null)
                return;

            var message = new ClientCloseDocumentMessage(messageString);
            client.Workspace.ScheduleAction(new CloseDocumentDescriptor(client, message.DocumentID));
        }

        void HandleOperation(string messageString)
        {
            if (client == null)
                return;

            var message = new ClientOperationMessage(messageString);
            client.Workspace.ScheduleAction(new ApplyOperationDescriptor(client, message.Operation, message.DocumentID));
        }

        void HandleGCMetadata(string messageString)
        {
            if (client == null)
                return;

            var message = new ClientGCMetadataMessage(messageString);
            client.Workspace.ScheduleAction(new GCMetadataDescriptor(client, message.DocumentID, message.Dependency));
        }

        protected override void OnClose(CloseEventArgs e)
        {
            Console.WriteLine($"Connection closed (client ID {client?.ID})");
            base.OnClose(e);
        }

        public void Send(object message)
        {
            base.Send(JsonConvert.SerializeObject(message));
        }
    }
}
