using Newtonsoft.Json;
using WebSocketServer.Model;

namespace WebSocketServer.MessageProcessing.ServerMessages
{
    internal class DeleteFolderMessage
    {
        [JsonProperty("msgType")] public ServerMessageTypes MsgType { get; } = ServerMessageTypes.DeleteFolder;
        [JsonProperty("fileID")] public int FileID { get; set; }

        public DeleteFolderMessage(int fileID)
        {
            FileID = fileID;
        }
    }
}
