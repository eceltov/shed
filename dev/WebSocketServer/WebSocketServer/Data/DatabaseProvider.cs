using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.Database;

namespace WebSocketServer.Data
{
    internal static class DatabaseProvider
    {
        public static IDatabase Database { get; private set; }

        static DatabaseProvider()
        {
            Database = new Database.Database();
        }
    }
}
