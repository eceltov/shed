using Newtonsoft.Json;
using WebSocketServer.Model;

namespace WebSocketServer.MessageProcessing.ServerMessages
{
    internal class GCMetadataRequestMessage
    {
        [JsonProperty("msgType")] public ServerMessageTypes MsgType { get; } = ServerMessageTypes.GCMetadataRequest;
        [JsonProperty("fileID")] public int FileID { get; set; }

        public GCMetadataRequestMessage(int fileID)
        {
            FileID = fileID;
        }
    }
}
