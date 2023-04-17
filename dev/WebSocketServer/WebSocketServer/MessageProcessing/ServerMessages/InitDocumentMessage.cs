using Newtonsoft.Json;
using TextOperations.Types;
using WebSocketServer.Model;
using WebSocketServer.Utilities.TextOperationsConverters;

namespace WebSocketServer.MessageProcessing.ServerMessages
{
    internal class InitDocumentMessage
    {
        [JsonProperty("msgType")] public ServerMessageTypes MsgType { get; } = ServerMessageTypes.InitDocument;
        [JsonProperty("serverDocument")] public List<string> ServerDocument { get; set; }
        [JsonProperty("fileID")] public int FileID { get; set; }
        [JsonProperty("serverHB", ItemConverterType = typeof(WOperationConverter))] public List<WrappedOperation> ServerHB { get; set; }
        [JsonProperty("serverOrdering", ItemConverterType = typeof(OperationMetadataConverter))] public List<OperationMetadata> ServerOrdering { get; set; }
        [JsonProperty("firstSOMessageNumber")] public int FirstSOMessageNumber { get; set; }

        public InitDocumentMessage(List<string> serverDocument, int fileID, List<WrappedOperation> serverHB, List<OperationMetadata> serverOrdering, int firstSOMessageNumber)
        {
            ServerDocument = serverDocument;
            FileID = fileID;
            ServerHB = serverHB;
            ServerOrdering = serverOrdering;
            FirstSOMessageNumber = firstSOMessageNumber;
        }
    }
}
