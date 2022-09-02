using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.Model;

namespace WebSocketServer.Data
{
    internal static class Clients
    {
        static List<Client> clients;

        static Clients()
        {
            clients = new List<Client>();
        }

        public static void AddClient(Client client)
        {
            clients.Add(client);
        }
    }
}
