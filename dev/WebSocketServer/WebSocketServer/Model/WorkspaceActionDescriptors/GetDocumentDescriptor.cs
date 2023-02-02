﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSocketServer.Model.WorkspaceActionDescriptors
{
    internal class GetDocumentDescriptor : IWorkspaceActionDescriptor
    {
        public Client Client { get; set; }
        public int FileID { get; set; }

        public GetDocumentDescriptor(Client client, int fileID)
        {
            Client = client;
            FileID = fileID;
        }

        public bool Execute(Workspace workspace)
        {
            return workspace.HandleGetDocument(Client, FileID);
        }
    }
}