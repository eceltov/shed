using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.Configuration;
using WebSocketServer.MessageProcessing;
using WebSocketSharp.Server;

namespace WebSocketServer.Model
{
    internal class WorkspaceServer
    {
        public void Start()
        {
            var httpsv = new HttpServer(ConfigurationManager.Configuration.FallbackSettings.WorkspaceServerPort);

            httpsv.AddWebSocketService<ClientInterface>("/");

            httpsv.Start();

            if (httpsv.IsListening)
            {
                Console.WriteLine($"WebSocketServer running on port {httpsv.Port}");

                foreach (var path in httpsv.WebSocketServices.Paths)
                    Console.WriteLine("- {0}", path);
            }

            while (Console.ReadLine() != null) ;
        }
    }
}
