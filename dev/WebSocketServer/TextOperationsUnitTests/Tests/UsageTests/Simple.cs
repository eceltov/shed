using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;
using WebSocketServer.Data;
using WebSocketServer.MessageProcessing;
using WebSocketServer.Parsers.MessageParsers;

namespace TextOperationsUnitTests.Tests.UsageTests
{
    class ClientInterfaceWrapper
    {
        public ClientInterface Client { get; private set; }

        public ClientInterfaceWrapper()
        {
            Client = new ClientInterface();
        }

        public void Connect(string workspaceHash)
        {
            ClientConnectMessage connectMessage = new()
            {
                MsgType = WebSocketServer.Model.ClientMessageTypes.Connect,
                Token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwIiwiZmlyc3ROYW1lIjoiQWRhbSIsImxhc3ROYW1lIjoiVGVzdGVyIiwibWFpbCI6ImFkYW0udGVzdGVyQGV4YW1wbGUuY29tIiwicm9sZSI6InRlc3QiLCJuYmYiOjE2Nzg1MjE1NjEsImV4cCI6MTY3OTEyNjM2MSwiaWF0IjoxNjc4NTIxNTYxfQ.4wYUUqT8KR9f0PWheBk5wymYlfdEIwBRDxdr_s81qoc",
                WorkspaceHash = workspaceHash,
            };
            string messageString = JsonConvert.SerializeObject(connectMessage);
            Client.HandleMessage(messageString);
        }

        public void GetDocument(int documentID)
        {
            ClientGetDocumentMessage documentMessage = new()
            {
                MsgType = WebSocketServer.Model.ClientMessageTypes.GetDocument,
                FileID = documentID,
            };
            string messageString = JsonConvert.SerializeObject(documentMessage);
            Client.HandleMessage(messageString);
        }

        public void SendOperation(Operation operation, int documentID)
        {
            OperationMessage operationMessage = new(operation, documentID);
            string messageString = JsonConvert.SerializeObject(operationMessage);
            Client.HandleMessage(messageString);
        }
    }

    [TestClass]
    public class Simple
    {
        void EnvSetup()
        {
            string pathToVolumes = "../../../../../volumes";
            Environment.SetEnvironmentVariable("PATH_TO_VOLUMES", pathToVolumes);
            Environment.SetEnvironmentVariable("PATH_TO_CONFIG", pathToVolumes + "/Configuration/config.json");
            Environment.SetEnvironmentVariable("PATH_TO_DATA", pathToVolumes + "/Data/");
        }

        [TestMethod]
        public void A()
        {
            EnvSetup();
            ClientInterfaceWrapper client1 = new ClientInterfaceWrapper();
            ClientInterfaceWrapper client2 = new ClientInterfaceWrapper();
            client1.Connect("testworkspace");
            client2.Connect("testworkspace");
            client1.GetDocument(1);
            client2.GetDocument(1);

            var op1 = new Operation(new(2, 7, -1, -1), new() {
                new Newline(0, 0),
                new Newline(0, 0),
                new Newline(0, 0),
                new Newline(0, 0),
                new Newline(0, 0),
                new Add(0, 0, "aaa"),
                new Add(1, 0, "a"),
                new Add(2, 0, "aaa"),
                new Add(3, 0, "aaa"),
            });

            var op2 = new Operation(new(1, 8, 2, 7), new() {
                new Del(0, 0, 3),
                new Del(1, 0, 1),
                new Del(2, 0, 3),
                new Del(3, 0, 3),
                new Remline(0, 0),
                new Remline(0, 0),
                new Remline(0, 0),
                new Remline(0, 0),
                new Remline(0, 0),
                new Add(0, 0, "o"),
                new Newline(0, 1),
                new Add(1, 0, "o"),
            });

            var op3 = new Operation(new(1, 9, 2, 7), new() {
                new Newline(1, 1),
                new Add(2, 0, "o"),
            });

            var op4 = new Operation(new(2, 8, 2, 7), new() {
                new Del(0, 0, 3),
                new Del(1, 0, 1),
                new Del(2, 0, 3),
                new Del(3, 0, 3),
                new Remline(0, 0),
                new Remline(0, 0),
                new Remline(0, 0),
                new Remline(0, 0),
                new Remline(0, 0),
                new Add(0, 0, "p"),
                new Newline(0, 1),
                new Add(1, 0, "p"),
            });

            var op5 = new Operation(new(2, 9, 2, 7), new() {
                new Newline(1, 1),
                new Add(2, 0, "pp"),
            });

            var op6 = new Operation(new(2, 10, 2, 7), new() {
                new Newline(2, 2),
            });

            client2.SendOperation(op1, 1);
            client1.SendOperation(op2, 1);
            client1.SendOperation(op3, 1);
            client2.SendOperation(op4, 1);
            client2.SendOperation(op5, 1);
            client2.SendOperation(op6, 1);

            Thread.Sleep(1000000);
        }

        [TestMethod]
        public void B()
        {
            EnvSetup();
            ClientInterfaceWrapper client1 = new ClientInterfaceWrapper();
            ClientInterfaceWrapper client2 = new ClientInterfaceWrapper();
            client1.Connect("testworkspace");
            client2.Connect("testworkspace");
            client1.GetDocument(1);
            client2.GetDocument(1);

            var op1 = new Operation(new(2, 7, -1, -1), new() {
                new Newline(0, 0),
                new Add(0, 0, "aaa"),
            });

            var op2 = new Operation(new(1, 8, 2, 7), new() {
                new Del(0, 0, 3),
                new Remline(0, 0),
                new Add(0, 0, "o"),
            });

            var op3 = new Operation(new(2, 8, 2, 7), new() {
                new Del(0, 0, 3),
                new Remline(0, 0),
                new Add(0, 0, "p"),
            });

            var op4 = new Operation(new(2, 9, 2, 7), new() {
                new Newline(0, 1),
                new Add(1, 0, "p"),
            });

            client2.SendOperation(op1, 1);
            client1.SendOperation(op2, 1);
            client2.SendOperation(op3, 1);
            client2.SendOperation(op4, 1);

            Thread.Sleep(1000000);
        }

        [TestMethod]
        public void C()
        {
            EnvSetup();
            ClientInterfaceWrapper client1 = new ClientInterfaceWrapper();
            ClientInterfaceWrapper client2 = new ClientInterfaceWrapper();
            client1.Connect("testworkspace");
            client2.Connect("testworkspace");
            client1.GetDocument(1);
            client2.GetDocument(1);

            var op1 = new Operation(new(2, 7, -1, -1), new() {
                new Newline(0, 0),
                new Newline(0, 0),
                new Add(0, 0, "aaa"),
            });

            var op2 = new Operation(new(1, 8, 2, 7), new() {
                new Del(0, 0, 3),
                new Remline(0, 0),
                new Remline(0, 0),
                new Add(0, 0, "o"),
            });

            var op3 = new Operation(new(2, 8, 2, 7), new() {
                new Del(0, 0, 3),
                new Remline(0, 0),
                new Remline(0, 0),
                new Add(0, 0, "p"),
            });

            var op4 = new Operation(new(2, 9, 2, 7), new() {
                new Newline(0, 1),
                new Add(1, 0, "p"),
            });

            client2.SendOperation(op1, 1);
            client1.SendOperation(op2, 1);
            client2.SendOperation(op3, 1);
            client2.SendOperation(op4, 1);

            Thread.Sleep(1000000);
        }
    }
}
