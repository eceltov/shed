using System;
using System.Configuration;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using WebSocketServer.Configuration;
using WebSocketServer.Database;
using WebSocketServer.MessageProcessing;
using WebSocketServer.Model;
using WebSocketServer.Parsers.MessageParsers;
using WebSocketSharp;
using WebSocketSharp.Net;
using WebSocketSharp.Server;

namespace Example3
{
    public class Program
    {
        public static void Main(string[] args)
        {
            Console.WriteLine(MessageProcessor.GenerateTestToken1());
            Console.WriteLine(MessageProcessor.GenerateTestToken2());
            WorkspaceServer workspaceServer = new WorkspaceServer();
            workspaceServer.Start();
        }
    }
}
