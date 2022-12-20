using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.Parsers.DatabaseParsers;

namespace WebSocketServer.Model
{
    internal class Workspace
    {
        public FileStructureParser FileStructure { get; private set; }
        public WorkspaceUsersParser Users { get; private set; }
        public string Name { get; private set; }
        public string ID { get; private set; }


        public Workspace(string ID, string name, FileStructureParser fileStructure, WorkspaceUsersParser users)
        {
            this.ID = ID;
            Name = name;
            FileStructure = fileStructure;
            Users = users;
        }
    }
}






