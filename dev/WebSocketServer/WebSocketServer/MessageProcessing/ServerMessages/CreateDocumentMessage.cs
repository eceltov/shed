using Newtonsoft.Json;
using WebSocketServer.Model;

namespace WebSocketServer.MessageProcessing.ServerMessages
{
    internal class CreateDocumentMessage
    {
        [JsonProperty("msgType")] public ServerMessageTypes MsgType { get; } = ServerMessageTypes.CreateDocument;
        [JsonProperty("parentID")] public int ParentID { get; set; }
        [JsonProperty("fileID")] public int FileID { get; set; }
        [JsonProperty("name")] public string Name { get; set; }

        public CreateDocumentMessage(int parentID, int fileID, string name)
        {
            ParentID = parentID;
            FileID = fileID;
            Name = name;
        }
    }
}
