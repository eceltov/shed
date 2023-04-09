﻿using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TextOperations.Types;
using WebSocketServer.Model;
using WebSocketServer.Parsers.DatabaseParsers;
using WebSocketServer.Utilities.TextOperationsConverters;
using WebSocketServer.Utilities.TextOperationsWriters;

namespace WebSocketServer.MessageProcessing
{
    internal class InitWorkspaceMessage
    {
        [JsonProperty("msgType")] public ServerMessageTypes MsgType { get; } = ServerMessageTypes.InitWorkspace;
        [JsonProperty("clientID")] public int ClientID { get; set; }
        [JsonProperty("fileStructure")] public FileStructure FileStructure { get; set; }
        [JsonProperty("role")] public Roles Role { get; set; }

        public InitWorkspaceMessage(int clientID, FileStructure fileStructure, Roles role)
        {
            ClientID = clientID;
            FileStructure = fileStructure;
            Role = role;
        }
    }

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

    internal class DeleteDocumentMessage
    {
        [JsonProperty("msgType")] public ServerMessageTypes MsgType { get; } = ServerMessageTypes.DeleteDocument;
        [JsonProperty("fileID")] public int FileID { get; set; }

        public DeleteDocumentMessage(int fileID)
        {
            FileID = fileID;
        }
    }

    internal class DeleteFolderMessage
    {
        [JsonProperty("msgType")] public ServerMessageTypes MsgType { get; } = ServerMessageTypes.DeleteFolder;
        [JsonProperty("fileID")] public int FileID { get; set; }

        public DeleteFolderMessage(int fileID)
        {
            FileID = fileID;
        }
    }

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

    internal class GCMetadataRequestMessage
    {
        [JsonProperty("msgType")] public ServerMessageTypes MsgType { get; } = ServerMessageTypes.GCMetadataRequest;
        [JsonProperty("fileID")] public int FileID { get; set; }

        public GCMetadataRequestMessage(int fileID)
        {
            FileID = fileID;
        }
    }

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

    [JsonConverter(typeof(ServerOperationMessageConverter))]
    internal class OperationMessage
    {
        public Operation Operation { get; set; }
        public int DocumentID { get; set; }

        public OperationMessage(Operation operation, int documentID)
        {
            Operation = operation;
            DocumentID = documentID;
        }
    }

    internal class ServerOperationMessageConverter : JsonConverter
    {
        public override bool CanConvert(Type objectType)
        {
            return objectType == typeof(OperationMessage);
        }

        public override object ReadJson(JsonReader reader, Type objectType, object? existingValue, JsonSerializer serializer)
        {
            throw new NotImplementedException();
        }

        public override void WriteJson(JsonWriter writer, object? value, JsonSerializer serializer)
        {
            OperationMessage message = (OperationMessage)value;

            writer.WriteStartArray();

            // metadata
            OperationMetadataJsonWriter.WriteJson(writer, message.Operation.Metadata, serializer);

            // dif
            DifJsonWriter.WriteJson(writer, message.Operation.Dif, serializer);

            // documentID
            writer.WriteValue(message.DocumentID);

            writer.WriteEndArray();
        }
    }
}
