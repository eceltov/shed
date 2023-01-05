using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.MessageProcessing;
using WebSocketSharp.Server;

namespace WebSocketServer.Model
{
    internal class WorkspaceServer
    {
        public void Start()
        {
            var httpsv = new HttpServer(80);

            httpsv.AddWebSocketService<ClientInterface>("/");

            httpsv.Start();

            if (httpsv.IsListening)
            {
                Console.WriteLine("Listening on port {0}, and providing WebSocket services:", httpsv.Port);

                foreach (var path in httpsv.WebSocketServices.Paths)
                    Console.WriteLine("- {0}", path);
            }

            Console.WriteLine("\nPress Enter key to stop the server...");
            Console.ReadLine();

            httpsv.Stop();
        }
    }
}
