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
        ///TODO: this should by a synchronized structure
        static Dictionary<int, Client> clients;

        static Clients()
        {
            clients = new();
        }

        public static void Add(Client client)
        {
            if (clients.ContainsKey(client.ID))
                throw new Exception("Adding a client that is already present.");

            clients[client.ID] = client;
        }
    }
}
