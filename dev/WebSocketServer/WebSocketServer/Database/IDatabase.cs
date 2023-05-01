using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.Model;
using WebSocketServer.Parsers.DatabaseParsers;

namespace WebSocketServer.Database
{
    internal interface IDatabase
    {
        Task<User?> GetUserAsync(string userID);

        Task<Roles> GetUserWorkspaceRoleAsync(string userID, string workspaceHash);

        Task<string> GetDocumentDataAsync(string workspaceHash, string relativePath);

        Task<FileStructure?> GetFileStructureAsync(string workspaceHash);

        /// <summary>
        /// Replaces the old file structure with a new one.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace of the file structure.</param>
        /// <param name="fileStructure">The data to be written.</param>
        Task<bool> UpdateFileStructureAsync(string workspaceHash, FileStructure fileStructure);

        /// <summary>
        /// Attempts to create a document.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace in which to create the document.</param>
        /// <param name="relativePath">The path of the document.</param>
        /// <returns>Returns whether the document was created successfully.</returns>
        Task<bool> CreateDocumentAsync(string workspaceHash, string relativePath);

        /// <summary>
        /// Attempts to create a folder.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace in which to create the folder.</param>
        /// <param name="relativePath">The path of the folder.</param>
        /// <returns>Returns whether the folder was created successfully.</returns>
        Task<bool> CreateFolderAsync(string workspaceHash, string relativePath);

        /// <summary>
        /// Attempts to delete a document.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace in which to delete the document.</param>
        /// <param name="relativePath">The path of the document.</param>
        /// <returns>Returns whether the document was deleted successfully.</returns>
        Task<bool> DeleteDocumentAsync(string workspaceHash, string relativePath);

        /// <summary>
        /// Attempts to delete a folder.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace in which to delete the folder.</param>
        /// <param name="relativePath">The path of the folder.</param>
        /// <returns>Returns whether the folder was deleted successfully.</returns>
        Task<bool> DeleteFolderAsync(string workspaceHash, string relativePath);

        /// <summary>
        /// Attempts to rename a document or folder.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace in which to rename the file.</param>
        /// <param name="oldRelativePath">The path to the file.</param>
        /// <param name="newRelativePath">The new path to the file.</param>
        /// <returns>Returns whether the file was deleted successfully.</returns>
        Task<bool> RenameFileAsync(string workspaceHash, string oldRelativePath, string newRelativePath);

        /// <summary>
        /// Attempts to write data to a document. The original document content is overwritten.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace containing the document.</param>
        /// <param name="relativePath">The path of the document.</param>
        /// <param name="documentRows"></param>
        /// <returns>Returns whether the file was modified successfully.</returns>
        Task<bool> WriteDocumentDataAsync(string workspaceHash, string relativePath, List<string> documentRows);

        /// <summary>
        /// Adds a workspace entry to a user.
        /// </summary>
        /// <param name="userID">The ID of the user.</param>
        /// <param name="workspaceHash">The hash of the workspace.</param>
        /// <param name="workspaceName">The name of the workspace.</param>
        /// <param name="role">The role the user has in the workspace.</param>
        /// <returns></returns>
        Task<bool> AddUserWorkspaceAsync(string userID, string workspaceHash, string workspaceName, Roles role);

        Task<bool> RemoveUserWorkspaceAsync(string userID, string workspaceHash);

        Task<bool> CreateWorkspaceAsync(string ownerID, string name);

        Task<bool> DeleteWorkspaceAsync(string workspaceHash);

        Task<WorkspaceUsers?> GetWorkspaceUsersAsync(string workspaceHash);

        Task<bool> UpdateWorkspaceUsersAsync(string workspaceHash, WorkspaceUsers workspaceUsers);

        /// <summary>
        /// Adds a user to a workspace.
        /// If already present, updates its role instead.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace.</param>
        /// <param name="workspaceName">The name of the workspace.</param>
        /// <param name="username">The username of the user.</param>
        /// <param name="role">The desired role of the user.</param>
        /// <returns>Return whether the operation succeeded.</returns>
        Task<bool> AddUserToWorkspaceAsync(string workspaceHash, string workspaceName, string username, Roles role);

        Task<string?> GetUsernameFromIDAsync(string username);

        Task<User?> GetUserByUsernameAsync(string username);
    }
}
