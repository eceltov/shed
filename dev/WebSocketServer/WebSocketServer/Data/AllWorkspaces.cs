using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.Model;

namespace WebSocketServer.Data
{
    internal static class AllWorkspaces
    {
        readonly static SemaphoreSlim workspaceCreationSemaphore = new(1);
        readonly static ConcurrentDictionary<string, Workspace> workspaces = new();

        /// <summary>
        /// Attempts to retrieve a workspace. If the workspace is not loaded yet, a load attempt will be made.
        /// </summary>
        /// <param name="workspaceID">The ID of the workspace.</param>
        /// <returns>Returns the workspace if found, otherwise null.</returns>
        public static async Task<Workspace?> GetWorkspaceAsync(string workspaceID)
        {
            if (workspaces.TryGetValue(workspaceID, out Workspace? workspace) && workspace != null)
                return workspace;

            await workspaceCreationSemaphore.WaitAsync();
            try
            {
                if (workspaces.ContainsKey(workspaceID))
                {
                    return workspaces[workspaceID];
                }

                var newlyLoadedWorkspace = await LoadWorkspaceAsync(workspaceID);

                if (newlyLoadedWorkspace != null)
                    workspaces[workspaceID] = newlyLoadedWorkspace;

                return newlyLoadedWorkspace;
            }
            finally
            {
                workspaceCreationSemaphore.Release();
            }
        }

        static async Task<Workspace?> LoadWorkspaceAsync(string workspaceID)
        {
            var fileStructure = await DatabaseProvider.Database.GetFileStructureAsync(workspaceID);
            var users = await DatabaseProvider.Database.GetWorkspaceUsersAsync(workspaceID);
            var config = await DatabaseProvider.Database.GetWorkspaceConfigAsync(workspaceID);

            if (fileStructure == null || users == null || config == null)
                return null;

            return new Workspace(workspaceID, fileStructure.Name, fileStructure, users, config);
        }
    }
}
