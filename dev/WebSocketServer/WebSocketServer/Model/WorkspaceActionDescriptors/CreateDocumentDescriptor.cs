﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSocketServer.Model.WorkspaceActionDescriptors
{
    internal class CreateDocumentDescriptor : IWorkspaceActionDescriptor
    {
        public Client Client { get; set; }
        public int ParentID { get; set; }
        public string Name { get; set; }

        public CreateDocumentDescriptor(Client client, int parentID, string name)
        {
            Client = client;
            ParentID = parentID;
            Name = name;
        }

        public bool Execute(Workspace workspace)
        {
            return workspace.HandleCreateDocument(Client, ParentID, Name);
        }
    }
}