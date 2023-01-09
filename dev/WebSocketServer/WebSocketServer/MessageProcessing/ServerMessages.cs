using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.Model;
using WebSocketServer.Parsers.DatabaseParsers;

namespace WebSocketServer.MessageProcessing
{
    public class InitWorkspaceMessage
    {
        public ServerMessageTypes msgType { get; } = ServerMessageTypes.InitWorkspace;
        [JsonProperty("clientID")] public int ClientID { get; set; }
        [JsonProperty("fileStructure")] public FileStructure FileStructure { get; set; }
        [JsonProperty("role")] public Roles Role { get; set; }

        public InitWorkspaceMessage(int clientID, FileStructure fileStructure, Roles role)
        {
            ClientID = clientID;
            FileStructure = fileStructure;
            Role = role;
        }
    }

    public class InitDocumentMessage
    {
        public ServerMessageTypes msgType { get; } = ServerMessageTypes.InitDocument;
        [JsonProperty("serverDocument")] public List<string> ServerDocument { get; set; }
        [JsonProperty("fileID")] public int FileID { get; set; }
        ///TODO: change type
        [JsonProperty("serverHB")] public List<object> ServerHB { get; set; }
        [JsonProperty("serverOrdering")] public List<int[]> ServerOrdering { get; set; }
        [JsonProperty("firstSOMessageNumber")] public int FirstSOMessageNumber { get; set; }

        public InitDocumentMessage(List<string> serverDocument, int fileID, List<object> serverHB, List<int[]> serverOrdering, int firstSOMessageNumber)
        {
            ServerDocument = serverDocument;
            FileID = fileID;
            ServerHB = serverHB;
            ServerOrdering = serverOrdering;
            FirstSOMessageNumber = firstSOMessageNumber;
        }
    }
}
