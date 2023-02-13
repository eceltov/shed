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

            // only an operation uses JSON arrays
            if (e.Data[0] == '[')
            {
                HandleOperation(e);
                return;
            }

            var genericMessage = new ClientMessage(e.Data);
            switch (genericMessage.MsgType)
            {
                case ClientMessageTypes.Connect:
                    HandleConnect(e);
                    break;
                case ClientMessageTypes.GetDocument:
                    HandleGetDocument(e);
                    break;
                case ClientMessageTypes.CreateDocument:
                    HandleCreateDocument(e);
                    break;
                case ClientMessageTypes.CreateFolder:
                    HandleCreateFolder(e);
                    break;
                case ClientMessageTypes.DeleteDocument:
                    HandleDeleteDocument(e);
                    break;
                case ClientMessageTypes.DeleteFolder:
                    HandleDeleteFolder(e);
                    break;
                case ClientMessageTypes.RenameFile:
                    HandleRenameFile(e);
                    break;
                default:
                    Console.WriteLine($"Received unknown message type: {genericMessage.MsgType}");
                    break;
            }
        }

        void HandleConnect(MessageEventArgs e)
        {
            var message = new ClientConnectMessage(e.Data);
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

        void HandleGetDocument(MessageEventArgs e)
        {
            if (client == null)
                return;

            var message = new ClientGetDocumentMessage(e.Data);
            client.Workspace.ScheduleAction(new GetDocumentDescriptor(client, message.FileID));

        }

        void HandleCreateDocument(MessageEventArgs e)
        {
            if (client == null)
                return;

            var message = new ClientCreateDocumentMessage(e.Data);
            client.Workspace.ScheduleAction(new CreateDocumentDescriptor(client, message.ParentID, message.Name));
        }

        void HandleCreateFolder(MessageEventArgs e)
        {
            if (client == null)
                return;

            var message = new ClientCreateFolderMessage(e.Data);
            client.Workspace.ScheduleAction(new CreateFolderDescriptor(client, message.ParentID, message.Name));
        }

        void HandleDeleteDocument(MessageEventArgs e)
        {
            if (client == null)
                return;

            var message = new ClientDeleteDocumentMessage(e.Data);
            client.Workspace.ScheduleAction(new DeleteDocumentDescriptor(client, message.FileID));
        }

        void HandleDeleteFolder(MessageEventArgs e)
        {
            if (client == null)
                return;

            var message = new ClientDeleteFolderMessage(e.Data);
            client.Workspace.ScheduleAction(new DeleteFolderDescriptor(client, message.FileID));
        }

        void HandleRenameFile(MessageEventArgs e)
        {
            if (client == null)
                return;

            var message = new ClientRenameFileMessage(e.Data);
            client.Workspace.ScheduleAction(new RenameFileDescriptor(client, message.FileID, message.Name));
        }

        void HandleOperation(MessageEventArgs e)
        {
            if (client == null)
                return;

            var message = new ClientOperationMessage(e.Data);
            client.Workspace.ScheduleAction(new ApplyOperationDescriptor(client, message.Operation, message.DocumentID));
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
