using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.Data;
using WebSocketServer.Model;
using WebSocketServer.Parsers.MessageParsers;
using WebSocketSharp;
using WebSocketSharp.Server;

namespace WebSocketServer.MessageProcessing
{
    internal class ClientInterface : WebSocketBehavior
    {
        MessageProcessor messageProcessor = new();

        protected override void OnMessage(MessageEventArgs e)
        {
            var genericMessage = new ClientMessage(e.Data);
            Console.WriteLine(e.Data);
            switch (genericMessage.msgType)
            {
                case ClientMessageTypes.Connect:
                    var message = new ClientConnectMessage(e.Data);
                    string? userID = messageProcessor.AcceptConnection(message);
                    if (userID != null)
                    {

                        Client? client = Client.CreateClient(userID, this);
                        if (client != null)
                        {
                            Clients.Add(client);
                            Console.WriteLine("added client");
                            client.Connection.Send("test");
                        }
                    }
                    break;
                default:
                    Console.WriteLine($"Received unknown message type: {genericMessage.msgType}");
                    break;
            }
        }

        new public void Send(string message)
        {
            base.Send(message);
        }
    }
}
