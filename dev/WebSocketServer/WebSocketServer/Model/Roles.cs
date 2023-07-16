using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebSocketServer.Model
{
    public enum Roles
    {
        None = 0,
        Viewer = 1,
        Editor = 2, // cannot create/delete/rename files
        WorkspaceEditor = 3, // can create/delete/rename files
        Admin = 4,
        Owner = 5,
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
                case Roles.None:
                    roleName = "None";
                    break;
                case Roles.Viewer:
                    roleName = "Viewer";
                    break;
                case Roles.Editor:
                    roleName = "Editor";
                    break;
                case Roles.WorkspaceEditor:
                    roleName = "Workspace Editor";
                    break;
                case Roles.Admin:
                    roleName = "Admin";
                    break;
                case Roles.Owner:
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
            return (role == Roles.Viewer)
              || (role == Roles.Editor)
              || (role == Roles.WorkspaceEditor)
              || (role == Roles.Admin)
              || (role == Roles.Owner);
        }

        /// <param name="role">The role of some entity.</param>
        /// <returns>Returns true if the role can edit documents, else returns false.</returns>
        public static bool CanEdit(Roles role)
        {
            return (role == Roles.Editor)
              || (role == Roles.WorkspaceEditor)
              || (role == Roles.Admin)
              || (role == Roles.Owner);
        }

        /// <param name="role">The role of some entity.</param>
        /// <returns>Returns true if the role can create/delete/rename files, else returns false.</returns>
        public static bool CanManageFiles(Roles role)
        {
            return (role == Roles.WorkspaceEditor)
              || (role == Roles.Admin)
              || (role == Roles.Owner);
        }

        /// <param name="role">The role of some entity.</param>
        /// <returns>Returns true if the role can add users to workspaces, else returns false.</returns>
        public static bool CanAddUsers(Roles role)
        {
            return (role == Roles.Admin)
              || (role == Roles.Owner);
        }

        /// <param name="role">The role of some entity.</param>
        /// <returns>Returns true if the role can change access types workspaces, else returns false.</returns>
        public static bool CanChangeWorkspaceAccessType(Roles role)
        {
            return (role == Roles.Admin)
              || (role == Roles.Owner);
        }

        /// <param name="role">The role of some entity.</param>
        /// <returns>
        /// Returns true if a user with the specified role can
        /// be added to a workspace, else returns false.
        /// </returns>
        public static bool ValidWorkspaceAdditionRole(Roles role)
        {
            // None and Owner cannot be added.
            return (role == Roles.None)
              || (role == Roles.Viewer)
              || (role == Roles.Editor)
              || (role == Roles.WorkspaceEditor)
              || (role == Roles.Admin);
        }
    }
}
