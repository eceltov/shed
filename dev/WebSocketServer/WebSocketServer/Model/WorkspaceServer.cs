using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.Configuration;
using WebSocketServer.MessageProcessing;
using WebSocketServer.Utilities;
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
                Logger.WriteLine($"WebSocketServer running on port {httpsv.Port}");
            }

            while (Console.ReadLine() != null) ;
        }
    }
}
