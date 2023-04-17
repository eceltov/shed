using Newtonsoft.Json;
using WebSocketServer.Model;

namespace WebSocketServer.MessageProcessing.ServerMessages
{
    internal class DivergenceDetectedMessage
    {
        [JsonProperty("msgType")] public ServerMessageTypes MsgType { get; } = ServerMessageTypes.DivergenceDetected;
        [JsonProperty("fileID")] public int DocumentID { get; set; }

        public DivergenceDetectedMessage(int documentID)
        {
            DocumentID = documentID;
        }
    }
}
