﻿using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Operations;
using TextOperations.Types;
using WebSocketServer.Data;
using WebSocketServer.MessageProcessing;
using WebSocketServer.MessageProcessing.ServerMessages;
using WebSocketServer.Parsers.MessageParsers;

namespace TextOperationsUnitTests.Tests.UsageTests
{
    //these tests are for debugging scenarios generated from a live editing session
    ///TODO: add assertions
    //[TestClass]
    public class Simple
    {
        [TestMethod]
        public void A()
        {
            UsageTestsLibrary.EnvSetup();
            ClientInterfaceWrapper client1 = new ClientInterfaceWrapper();
            ClientInterfaceWrapper client2 = new ClientInterfaceWrapper();
            ///TODO: await this, does the TestMethod operator make async methods unavaitable?
            client1.ConnectAsync("testworkspace");
            client2.ConnectAsync("testworkspace");
            client1.GetDocumentAsync(1);
            client2.GetDocumentAsync(1);

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

            client2.SendOperationAsync(op1, 1);
            client1.SendOperationAsync(op2, 1);
            client1.SendOperationAsync(op3, 1);
            client2.SendOperationAsync(op4, 1);
            client2.SendOperationAsync(op5, 1);
            client2.SendOperationAsync(op6, 1);

            Thread.Sleep(1000000);
        }

        [TestMethod]
        public void B()
        {
            UsageTestsLibrary.EnvSetup();
            ClientInterfaceWrapper client1 = new ClientInterfaceWrapper();
            ClientInterfaceWrapper client2 = new ClientInterfaceWrapper();
            client1.ConnectAsync("testworkspace");
            client2.ConnectAsync("testworkspace");
            client1.GetDocumentAsync(1);
            client2.GetDocumentAsync(1);

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

            client2.SendOperationAsync(op1, 1);
            client1.SendOperationAsync(op2, 1);
            client2.SendOperationAsync(op3, 1);
            client2.SendOperationAsync(op4, 1);

            Thread.Sleep(1000000);
        }

        [TestMethod]
        public void C()
        {
            UsageTestsLibrary.EnvSetup();
            ClientInterfaceWrapper client1 = new ClientInterfaceWrapper();
            ClientInterfaceWrapper client2 = new ClientInterfaceWrapper();
            client1.ConnectAsync("testworkspace");
            client2.ConnectAsync("testworkspace");
            client1.GetDocumentAsync(1);
            client2.GetDocumentAsync(1);

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

            client2.SendOperationAsync(op1, 1);
            client1.SendOperationAsync(op2, 1);
            client2.SendOperationAsync(op3, 1);
            client2.SendOperationAsync(op4, 1);

            Thread.Sleep(1000000);
        }

        [TestMethod]
        public void Test()
        {
            var wLITDif = new Dif()
            {
                new Del(0, 0, 7),
                new Del(1, 0, 6),
                new Del(2, 0, 11),
                new Remline(0, 0),
                new Remline(0, 0),
                new Add(0, 0, "kop"),
                new Newline(0, 3),
                new Add(1, 0, "kop"),
                new Newline(1, 3),
            }.Wrap();

            var wDif1 = new Dif()
            {
                // (2, 0, op)
                new Add(1, 5, "op"),
                // (2, 1)
                new Newline(1, 6),
                // (3, 0, - ko)
                new Add(2, 0, "- ko"),
            }.Wrap();

            var wDif2 = new Dif()
            {
                // (3, 5, p), but should instead be add(2, 0, p)
                new Add(1, 4, "p"),
                // (3, 6), but should instead be (2, 1)
                new Newline(1, 5),
                // (4, 0, - ko), but should instead be (3, 0, - ko)
                new Add(2, 0, "- ko"),
            }.Wrap();

            var a = wDif1.MakeIndependent().LIT(wLITDif);
            wLITDif.AddRange(a);
            var b = wDif2.MakeIndependent().LIT(wLITDif);
        }

        [TestMethod]
        public void Test2()
        {
            var wLITDif = new Dif()
            {
                new Del(0, 0, 7),
            }.Wrap();

            var wDif1 = new Dif()
            {
                // (0, 0, op)
                new Add(0, 5, "op"),
            }.Wrap();

            var wDif2 = new Dif()
            {
                // (0, 2, p), but should be (0, 0, p) instead
                new Add(0, 4, "p"),
            }.Wrap();

            var a = wDif1.MakeIndependent().LIT(wLITDif);
            wLITDif.AddRange(a);
            var b = wDif2.MakeIndependent().LIT(wLITDif);
        }

        [TestMethod]
        public void D()
        {
            UsageTestsLibrary.EnvSetup();
            ClientInterfaceWrapper client1 = new ClientInterfaceWrapper();
            ClientInterfaceWrapper client2 = new ClientInterfaceWrapper();
            client1.ConnectAsync("testworkspace");
            client2.ConnectAsync("testworkspace");
            client1.GetDocumentAsync(8);
            client2.GetDocumentAsync(8);

            /*
            [[2,0,-1,-1],[[0,0,7],[1,0,6],[2,0,11],[0,0,false],[0,0,false],[0,0,"kop"],[0,3,true]],35]
            [[2,1,-1,-1],[[1,0,"kop"],[1,3,true]],35]
            [[1,0,-1,-1],[[1,5,"op"],[1,6,true],[2,0,"- ko"]],35]
            [[1,1,-1,-1],[[1,4,"p"],[1,5,true],[2,0,"- ko"]],35]
            [[1,2,-1,-1],[[2,4,"p"],[3,6,true],[4,0,"- k"]],35]
            [[1,3,-1,-1],[[2,1,6],[3,0,6],[4,0,3],[5,0,11],[2,1,false],[2,1,false],[2,1,false],[2,1,"kop"],[2,4,true],[3,0,"k"]],35]
            */

            var op1 = new Operation(new(2, 0, -1, -1), new() {
                new Del(0, 0, 7),
                new Del(1, 0, 6),
                new Del(2, 0, 11),
                new Remline(0, 0),
                new Remline(0, 0),
                new Add(0, 0, "kop"),
                new Newline(0, 3),
            });

            var op2 = new Operation(new(2, 1, -1, -1), new() {
                new Add(1, 0, "kop"),
                new Newline(1, 3),
            });

            var op3 = new Operation(new(1, 0, -1, -1), new() {
                // (2, 0, op)
                new Add(1, 5, "op"),
                // (2, 1)
                new Newline(1, 6),
                // (3, 0, - ko)
                new Add(2, 0, "- ko"),
            });

            var op4 = new Operation(new(1, 1, -1, -1), new() {
                // (3, 5, p), but should instead be add(2, 0, p)
                new Add(1, 4, "p"),
                // (3, 6), but should instead be (2, 1)
                new Newline(1, 5),
                // (4, 0, - ko), but should instead be (3, 0, - ko)
                new Add(2, 0, "- ko"),
            });

            var op5 = new Operation(new(1, 2, -1, -1), new() {
                new Add(2, 4, "p"),
                new Newline(3, 6),
                new Add(4, 0, "- k"),
            });

            var op6 = new Operation(new(1, 3, -1, -1), new() {
                new Del(2, 1, 6),
                new Del(3, 0, 6),
                new Del(4, 0, 3),
                new Del(5, 0, 11),
                new Remline(2, 1),
                new Remline(2, 1),
                new Remline(2, 1),
                new Add(2, 1, "kop"),
                new Newline(2, 4),
                new Add(3, 0, "k"),
            });

            client2.SendOperationAsync(op1, 8);
            client2.SendOperationAsync(op2, 8);
            client1.SendOperationAsync(op3, 8);
            client1.SendOperationAsync(op4, 8);
            client1.SendOperationAsync(op5, 8);
            client1.SendOperationAsync(op6, 8);

            Thread.Sleep(1000000);
        }
    }
}
