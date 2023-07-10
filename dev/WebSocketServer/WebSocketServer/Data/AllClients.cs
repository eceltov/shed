using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.Model;

namespace WebSocketServer.Data
{
    internal static class AllClients
    {
        static ConcurrentDictionary<int, Client> clients = new();

        /// <summary>
        /// Adds a client to the collection of all clients.
        /// </summary>
        /// <param name="client">The client to be added.</param>
        /// <returns>Returns whether the operation succeeded.</returns>
        public static bool Add(Client client)
        {
            return clients.TryAdd(client.ID, client);
        }

        /// <summary>
        /// Removes a client from the collection of all clients.
        /// </summary>
        /// <param name="client">The client to be removed.</param>
        /// <returns>Returns whether the operation succeeded.</returns>
        public static bool Remove(Client client)
        {
            return clients.TryRemove(client.ID, out Client? _);
        }
    }
}
