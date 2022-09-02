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
            switch (genericMessage.msgType)
            {
                case 0:
                    var message = new ClientConnectMessage(e.Data);
                    string? clientId = messageProcessor.AcceptConnection(message);
                    if (clientId != null)
                    {
                        Clients.AddClient(new Client(clientId, this));
                    }
                    break;
                default:
                    Console.WriteLine("Received unknown message type: {0}", genericMessage.msgType);
                    break;
            }
        }

        new public void Send(string message)
        {
            base.Send(message);
        }
    }
}
