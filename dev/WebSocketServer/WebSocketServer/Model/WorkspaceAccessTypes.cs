using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSocketServer.Model
{
    public enum WorkspaceAccessTypes
    {
        // only those with access can view and edit the workspace
        Privileged = 0,
        // only those with access can view the workspace
        ///TODO: not implemented
        PrivilegedReadOnly = 1,
        // all can view and edit the workspace
        All = 2,
        // all can view the workspace
        AllReadOnly = 3,
    }

    internal static class WorkspaceAccessHandler
    {
        /// <param name="accessType">The access type of the workpace.</param>
        /// <returns>Returns whether this access type allows guests to join the workspace.</returns>
        public static bool AllowsGuests(WorkspaceAccessTypes accessType)
        {
            return (accessType == WorkspaceAccessTypes.All)
                || (accessType == WorkspaceAccessTypes.AllReadOnly);
        }

        /// <param name="accessType">The access type of the workspace.</param>
        /// <param name="userRole">The role of the user.</param>
        /// <returns>Returns whether the user can view the workspace.</returns>
        public static bool CanAccessWorkspace(WorkspaceAccessTypes accessType, Roles userRole)
        {
            return RoleHandler.CanView(userRole) || AllowsGuests(accessType);
        }

        /// <param name="accessType">The access type of the workspace.</param>
        /// <param name="userRole">The role of the user.</param>
        /// <returns>Returns whether the user can edit documents of the workspace.</returns>
        public static bool CanEdit(WorkspaceAccessTypes accessType, Roles userRole)
        {
            return RoleHandler.CanEdit(userRole) || accessType == WorkspaceAccessTypes.All;
        }
    }
}
