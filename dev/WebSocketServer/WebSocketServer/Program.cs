using System;
using System.Configuration;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using WebSocketServer.Parsers;
using WebSocketSharp;
using WebSocketSharp.Net;
using WebSocketSharp.Server;

namespace Example3
{
    public class Program
    {
        public class Echo : WebSocketBehavior
        {
            protected override void OnMessage(MessageEventArgs e)
            {
                var data = ClientMessageFactory.GetParsedMessage(e.Data);
                Send(e.Data);
            }
        }

        public static void Main(string[] args)
        {
            var httpsv = new HttpServer(80);

            // Add the WebSocket services.
            httpsv.AddWebSocketService<Echo>("/");

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
