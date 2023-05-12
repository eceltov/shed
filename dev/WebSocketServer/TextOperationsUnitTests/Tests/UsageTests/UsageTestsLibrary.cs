using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;
using WebSocketServer.MessageProcessing.ServerMessages;
using WebSocketServer.MessageProcessing;
using WebSocketServer.Parsers.MessageParsers;

namespace TextOperationsUnitTests.Tests.UsageTests
{
    internal static class UsageTestsLibrary
    {
        public static void EnvSetup()
        {
            string pathToVolumes = "../../../../../volumes";
            Environment.SetEnvironmentVariable("PATH_TO_VOLUMES", pathToVolumes);
            Environment.SetEnvironmentVariable("PATH_TO_CONFIG", pathToVolumes + "/Configuration/config.json");
            Environment.SetEnvironmentVariable("PATH_TO_DATA", pathToVolumes + "/Data/");
        }
    }

    internal class ClientInterfaceWrapper
    {
        public ClientInterface Client { get; private set; }

        public ClientInterfaceWrapper()
        {
            Client = new ClientInterface();
        }

        public async Task ConnectAsync(string workspaceHash)
        {
            ClientConnectMessage connectMessage = new()
            {
                MsgType = WebSocketServer.Model.ClientMessageTypes.Connect,
                Token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwIiwicm9sZSI6InVzZXIiLCJleHAiOjE2ODM5ODg0NzMsImlhdCI6MTY4MzkwMjA3M30.wU2e-TdxSEVWEjk-_CrF6MqO-Sm6EpMN43F3lt1s55c",
                WorkspaceHash = workspaceHash,
            };
            string messageString = JsonConvert.SerializeObject(connectMessage);
            await Client.HandleMessageAsync(messageString);
        }

        public async Task GetDocumentAsync(int documentID)
        {
            ClientGetDocumentMessage documentMessage = new()
            {
                MsgType = WebSocketServer.Model.ClientMessageTypes.GetDocument,
                FileID = documentID,
            };
            string messageString = JsonConvert.SerializeObject(documentMessage);
            await Client.HandleMessageAsync(messageString);
        }

        public async Task SendOperationAsync(Operation operation, int documentID)
        {
            OperationMessage operationMessage = new(operation, documentID);
            string messageString = JsonConvert.SerializeObject(operationMessage);
            await Client.HandleMessageAsync(messageString);
        }
    }
}
