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
            this.ClientID = clientID;
            this.FileStructure = fileStructure;
            this.Role = role;
        }
    }
}
