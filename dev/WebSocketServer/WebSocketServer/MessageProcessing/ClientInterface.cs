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
            var genericMessage = new ClientMessage(e.Data);
            Console.WriteLine(e.Data);
            switch (genericMessage.MsgType)
            {
                case ClientMessageTypes.Connect:
                    HandleConnect(e);
                    break;
                case ClientMessageTypes.GetDocument:
                    HandleGetDocument(e);
                    break;
                default:
                    Console.WriteLine($"Received unknown message type: {genericMessage.MsgType}");
                    break;
            }
        }

        public void HandleConnect(MessageEventArgs e)
        {
            var message = new ConnectMessage(e.Data);
            string? userID = MessageProcessor.AcceptConnection(message);
            if (userID != null)
            {

                Workspace? workspace = Workspaces.GetWorkspace(message.WorkspaceHash);
                if (workspace == null) return;

                Client? newClient = Client.CreateClient(userID, workspace, this);
                if (newClient == null) return;

                client = newClient;
                Clients.Add(client);
                Console.WriteLine($"Added client {client.ID}");
                workspace.ScheduleAction(new ConnectClientDescriptor(client));
            }
        }

        public void HandleGetDocument(MessageEventArgs e)
        {
            if (client == null)
                return;

            var message = new GetDocumentMessage(e.Data);
            client?.Workspace.ScheduleAction(new GetDocumentDescriptor(client, message.FileID));

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
