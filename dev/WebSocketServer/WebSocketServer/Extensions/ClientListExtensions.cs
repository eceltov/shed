using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.Model;

namespace WebSocketServer.Extensions
{
    internal static class ClientListExtensions
    {
        public static void SendMessage(this List<Client> clients, object message)
        {
            foreach (var client in clients)
            {
                client.ClientInterface.Send(message);
            }
        }
    }
}
