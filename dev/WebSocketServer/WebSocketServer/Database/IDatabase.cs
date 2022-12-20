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
        UserParser? GetUser(string userID);

        Roles GetUserWorkspaceRole(string userID, string workspaceHash);

        string GetDocumentData(string workspaceHash, string relativePath);

        FileStructureParser? GetFileStructure(string workspaceHash);

        /// <summary>
        /// Replaces the old file structure with a new one.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace of the file structure.</param>
        /// <param name="fileStructure">The data to be written.</param>
        void UpdateFileStructure(string workspaceHash, FileStructureParser fileStructure);

        /// <summary>
        /// Attempts to create a document.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace in which to create the document.</param>
        /// <param name="relativePath">The path of the document.</param>
        /// <returns>Returns whether the document was created successfully.</returns>
        bool CreateDocument(string workspaceHash, string relativePath);

        /// <summary>
        /// Attempts to create a folder.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace in which to create the folder.</param>
        /// <param name="relativePath">The path of the folder.</param>
        /// <returns>Returns whether the folder was created successfully.</returns>
        bool CreateFolder(string workspaceHash, string relativePath);

        /// <summary>
        /// Attempts to delete a document.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace in which to delete the document.</param>
        /// <param name="relativePath">The path of the document.</param>
        /// <returns>Returns whether the document was deleted successfully.</returns>
        bool DeleteDocument(string workspaceHash, string relativePath);

        /// <summary>
        /// Attempts to delete a folder.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace in which to delete the folder.</param>
        /// <param name="relativePath">The path of the folder.</param>
        /// <returns>Returns whether the folder was deleted successfully.</returns>
        bool DeleteFolder(string workspaceHash, string relativePath);

        /// <summary>
        /// Attempts to rename a document or folder.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace in which to rename the file.</param>
        /// <param name="oldRelativePath">The path to the file.</param>
        /// <param name="newRelativePath">The new path to the file.</param>
        /// <returns>Returns whether the file was deleted successfully.</returns>
        bool RenameFile(string workspaceHash, string oldRelativePath, string newRelativePath);

        /// <summary>
        /// Attempts to write data to a document. The original document content is overwritten.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace containing the document.</param>
        /// <param name="relativePath">The path of the document.</param>
        /// <param name="documentRows"></param>
        /// <returns>Returns whether the file was modified successfully.</returns>
        bool WriteDocumentData(string workspaceHash, string relativePath, List<string> documentRows);

        /// <summary>
        /// Adds a workspace entry to a user.
        /// </summary>
        /// <param name="userID">The ID of the user.</param>
        /// <param name="workspaceHash">The hash of the workspace.</param>
        /// <param name="workspaceName">The name of the workspace.</param>
        /// <param name="role">The role the user has in the workspace.</param>
        /// <returns></returns>
        bool AddUserWorkspace(string userID, string workspaceHash, string workspaceName, Roles role);

        bool RemoveUserWorkspace(string userID, string workspaceHash);

        bool CreateWorkspace(string ownerID, string name);

        bool DeleteWorkspace(string workspaceHash);

        WorkspaceUsersParser GetWorkspaceUsers(string workspaceHash);

        void UpdateWorkspaceUsers(string workspaceHash, WorkspaceUsersParser workspaceUsers);
    }
}
