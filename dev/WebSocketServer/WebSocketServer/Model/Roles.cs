using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSocketServer.Model
{
    public enum Roles
    {
        none = 0,
        viewer = 1,
        editor = 2, // cannot create/delete/rename files
        workspaceEditor = 3, // can create/delete/rename files
        admin = 4,
        owner = 5,
    }

    internal static class RoleHandler
    {
        /// <param name="role">The role to be stringified.</param>
        /// <returns>Returns the string representation of a role.</returns>
        public static string GetRoleName(Roles role)
        {
            string roleName;
            switch (role)
            {
                case Roles.none:
                    roleName = "None";
                    break;
                case Roles.viewer:
                    roleName = "Viewer";
                    break;
                case Roles.editor:
                    roleName = "Editor";
                    break;
                case Roles.workspaceEditor:
                    roleName = "Workspace Editor";
                    break;
                case Roles.admin:
                    roleName = "Admin";
                    break;
                case Roles.owner:
                    roleName = "Owner";
                    break;
                default:
                    roleName = $"UndefinedRole: {role}";
                    break;
            }
            return roleName;
        }

        /// <param name="role">The role of some entity.</param>
        /// <returns>Returns true if the role can view documents, else returns false.</returns>
        public static bool CanView(Roles role)
        {
            return (role == Roles.viewer)
              || (role == Roles.editor)
              || (role == Roles.workspaceEditor)
              || (role == Roles.admin)
              || (role == Roles.owner);
        }

        /// <param name="role">The role of some entity.</param>
        /// <returns>Returns true if the role can edit documents, else returns false.</returns>
        public static bool CanEdit(Roles role)
        {
            return (role == Roles.editor)
              || (role == Roles.workspaceEditor)
              || (role == Roles.admin)
              || (role == Roles.owner);
        }

        /// <param name="role">The role of some entity.</param>
        /// <returns>Returns true if the role can create/delete/rename files, else returns false.</returns>
        public static bool CanManageFiles(Roles role)
        {
            return (role == Roles.workspaceEditor)
              || (role == Roles.admin)
              || (role == Roles.owner);
        }
    }
}
