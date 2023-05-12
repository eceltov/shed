using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Threading;
using TextOperations.Operations;
using TextOperations.Types;
using WebSocketServer.Data;
using WebSocketServer.MessageProcessing;
using WebSocketServer.MessageProcessing.ServerMessages;
using WebSocketServer.Parsers.MessageParsers;
using WebSocketServer.Model;
using System.Text.RegularExpressions;

namespace TextOperationsUnitTests.Tests.UsageTests
{
    
    [TestClass]
    public class ParallelTests
    {
        [TestMethod]
        public async Task SameLine()
        {
            UsageTestsLibrary.EnvSetup();
            const int clientCount = 10;
            const int opCount = 5;
            const int opLength = 20;
            const int documentIdx = 1;

            List<ClientInterfaceWrapper> clients = new();
            for (int i = 0; i < clientCount; i++)
                clients.Add(new ClientInterfaceWrapper());

            // connect clients
            Parallel.For(0, clientCount, async (i) =>
            {
                await clients[i].ConnectAsync("testworkspace");
                await clients[i].GetDocumentAsync(documentIdx);
            });

            Thread.Sleep(2000);

            // send operations
            Parallel.For(0, clientCount, async (i) =>
            {
                for (int j = 0; j < opCount; j++)
                {
                    var op = new Operation(new(i, j, -1, -1), new()
                    {
                        new Add(0, 0, new string('a', opLength))
                    });

                    await clients[i].SendOperationAsync(op, documentIdx);
                }
            });

            Thread.Sleep(2000);

            if (await AllWorkspaces.GetWorkspaceAsync("testworkspace") is not Workspace workspace)
            {
                Assert.Fail();
                return;
            }

            // disconnect clients (saves the document)
            for (int i = 0; i < clientCount; i++)
            {
                workspace.RemoveConnection(clients[i].Client.client!);
            }

            Thread.Sleep(2000);

            // get document
            if (await DatabaseProvider.Database.GetDocumentDataAsync("testworkspace", $"test{documentIdx}.txt") is not string document)
            {
                Assert.Fail();
                return;
            }

            // clean document
            await DatabaseProvider.Database.WriteDocumentDataAsync("testworkspace", $"test{documentIdx}.txt", new List<string> { "" });

            // assert same document length
            List<string> lines = Regex.Split(document, "\r\n|\r|\n").ToList();
            Assert.AreEqual(clientCount * opCount * opLength, lines[0].Length);
        }

        [TestMethod]
        public async Task TwoLines()
        {
            UsageTestsLibrary.EnvSetup();
            const int clientCount = 10;
            const int opCount = 5;
            const int opLength = 20;
            const int documentIdx = 2;

            List<ClientInterfaceWrapper> clients = new();
            for (int i = 0; i < clientCount; i++)
                clients.Add(new ClientInterfaceWrapper());

            // connect clients
            Parallel.For(0, clientCount, async (i) =>
            {
                await clients[i].ConnectAsync("testworkspace");
                await clients[i].GetDocumentAsync(documentIdx);
            });

            Thread.Sleep(2000);

            // send operations (clients adds characters to line clientIdx % 2)
            Parallel.For(0, clientCount, async (i) =>
            {
                for (int j = 0; j < opCount; j++)
                {
                    var op = new Operation(new(i, j, -1, -1), new()
                    {
                        new Add(i % 2, 0, new string('a', opLength))
                    });

                    await clients[i].SendOperationAsync(op, documentIdx);
                }
            });

            Thread.Sleep(2000);

            if (await AllWorkspaces.GetWorkspaceAsync("testworkspace") is not Workspace workspace)
            {
                Assert.Fail();
                return;
            }

            // disconnect clients (saves the document)
            for (int i = 0; i < clientCount; i++)
            {
                workspace.RemoveConnection(clients[i].Client.client!);
            }

            Thread.Sleep(2000);

            // get document
            if (await DatabaseProvider.Database.GetDocumentDataAsync("testworkspace", $"test{documentIdx}.txt") is not string document)
            {
                Assert.Fail();
                return;
            }

            // clean document
            await DatabaseProvider.Database.WriteDocumentDataAsync("testworkspace", $"test{documentIdx}.txt", new List<string> { "" });

            // assert same document length
            List<string> lines = Regex.Split(document, "\r\n|\r|\n").ToList();
            Assert.AreEqual(clientCount * opCount * opLength / 2, lines[0].Length);
            Assert.AreEqual(clientCount * opCount * opLength / 2, lines[1].Length);
        }
    }
}
