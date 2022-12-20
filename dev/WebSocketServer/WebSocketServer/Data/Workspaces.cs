using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.Model;

namespace WebSocketServer.Data
{
    internal static class Workspaces
    {
        ///TODO: this should be synchronized
        static Dictionary<string, Workspace> workspaces;

        static Workspaces()
        {
            workspaces = new();
        }

        public static Workspace GetWorkspace(string workspaceID)
        {
            if (workspaces.ContainsKey(workspaceID))
            {
                return workspaces[workspaceID];
            }

            ///TODO: check if workspace exists
            var workspace = LoadWorkspace(workspaceID);
            workspaces[workspaceID] = workspace;
            return workspace;
        }

        static Workspace LoadWorkspace(string workspaceID)
        {
            var fileStructure = DatabaseProvider.Database.GetFileStructure(workspaceID);
            var users = DatabaseProvider.Database.GetWorkspaceUsers(workspaceID);
            string name = fileStructure.name;
            return new Workspace(workspaceID, name, fileStructure, users);
        }
    }
}
