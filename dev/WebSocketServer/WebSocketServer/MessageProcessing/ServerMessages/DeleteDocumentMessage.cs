using Newtonsoft.Json;
using WebSocketServer.Model;

namespace WebSocketServer.MessageProcessing.ServerMessages
{
    internal class DeleteDocumentMessage
    {
        [JsonProperty("msgType")] public ServerMessageTypes MsgType { get; } = ServerMessageTypes.DeleteDocument;
        [JsonProperty("fileID")] public int FileID { get; set; }

        public DeleteDocumentMessage(int fileID)
        {
            FileID = fileID;
        }
    }
}
