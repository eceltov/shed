using Newtonsoft.Json;
using WebSocketServer.Model;

namespace WebSocketServer.MessageProcessing.ServerMessages
{
    internal class RenameFileMessage
    {
        [JsonProperty("msgType")] public ServerMessageTypes MsgType { get; } = ServerMessageTypes.RenameFile;
        [JsonProperty("fileID")] public int FileID { get; set; }
        [JsonProperty("name")] public string Name { get; set; }

        public RenameFileMessage(int fileID, string name)
        {
            FileID = fileID;
            Name = name;
        }
    }
}
