using Newtonsoft.Json;
using TextOperations.Types;
using WebSocketServer.Model;
using WebSocketServer.Utilities.TextOperationsConverters;

namespace WebSocketServer.MessageProcessing.ServerMessages
{
    internal class ForceDocumentMessage
    {
        [JsonProperty("msgType")] public ServerMessageTypes MsgType { get; } = ServerMessageTypes.ForceDocument;
        [JsonProperty("fileID")] public int DocumentID { get; set; }
        [JsonProperty("serverDocument")] public List<string> ServerDocument { get; set; }

        public ForceDocumentMessage(List<string> serverDocument, int documentID)
        {
            DocumentID = documentID;
            ServerDocument = serverDocument;
        }
    }
}
