using Newtonsoft.Json;
using WebSocketServer.Model;

namespace WebSocketServer.MessageProcessing.ServerMessages
{
    internal class CreateFolderMessage
    {
        [JsonProperty("msgType")] public ServerMessageTypes MsgType { get; } = ServerMessageTypes.CreateFolder;
        [JsonProperty("parentID")] public int ParentID { get; set; }
        [JsonProperty("fileID")] public int FileID { get; set; }
        [JsonProperty("name")] public string Name { get; set; }

        public CreateFolderMessage(int parentID, int fileID, string name)
        {
            ParentID = parentID;
            FileID = fileID;
            Name = name;
        }
    }
}
