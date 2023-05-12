using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.Model;

namespace WebSocketServer.Extensions
{
    internal static class ClientDictionaryExtensions
    {
        public static void SendMessage(this ConcurrentDictionary<int, Client> clients, object message)
        {
            foreach (var (clientID, client) in clients)
            {
                client.ClientInterface.Send(message);
            }
        }
    }
}
