using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.Data;
using WebSocketServer.MessageProcessing;
using WebSocketServer.Parsers.DatabaseParsers;

namespace WebSocketServer.Model
{
    internal class Client
    {
        public int ID { get; }
        public ClientInterface Connection { get; }
        public Workspace? Workspace { get; }

        public UserParser User { get; }

        private static int nextID = 0;

        public static Client? CreateClient(string userID, ClientInterface connection)
        {
            var user = DatabaseProvider.Database.GetUser(userID);

            if (user == null)
                return null;

            return new Client(user, connection);
        }

        Client(UserParser user, ClientInterface connection)
        {
            ID = Interlocked.Increment(ref nextID);
            Connection = connection;
            User = user;
        }
    }
}
