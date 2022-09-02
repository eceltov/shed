using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.MessageProcessing;

namespace WebSocketServer.Model
{
    internal class Client
    {
        public string Id { get; }
        public ClientInterface Connection { get; } 
        public Workspace? Workspace { get; }

        public Client(string id, ClientInterface connection)
        {
            Id = id;
            Connection = connection;
        }
    }
}
