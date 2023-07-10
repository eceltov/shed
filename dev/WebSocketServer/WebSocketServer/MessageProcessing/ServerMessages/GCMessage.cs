using Newtonsoft.Json;
using WebSocketServer.Model;

namespace WebSocketServer.MessageProcessing.ServerMessages
{
    internal class GCMessage
    {
        [JsonProperty("msgType")] public ServerMessageTypes MsgType { get; } = ServerMessageTypes.GC;
        [JsonProperty("fileID")] public int FileID { get; set; }
        [JsonProperty("GCOldestMessageNumber")] public int GCOldestMessageNumber { get; set; }

        public GCMessage(int fileID, int GCOldestMessageNumber)
        {
            FileID = fileID;
            this.GCOldestMessageNumber = GCOldestMessageNumber;
        }
    }
}
