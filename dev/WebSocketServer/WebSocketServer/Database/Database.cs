using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.Configuration;
using WebSocketServer.Model;
using WebSocketServer.Parsers.DatabaseParsers;

///TODO: possible race condition: delete and add operation on the same user

namespace WebSocketServer.Database
{
    internal class Database : IDatabase
    {
        private string WorkspacesPath { get; set; }
        private string UsersPath { get; set; }

        public Database()
        {
            WorkspacesPath = Path.Combine(
                EnvironmentVariables.DataPath,
                ConfigurationManager.Configuration.Database.Paths.WorkspacesPath
            );

            UsersPath = Path.Combine(
                EnvironmentVariables.DataPath,
                ConfigurationManager.Configuration.Database.Paths.UsersPath
            );
        }

        string GetWorkspacePath(string workspaceHash)
        {
            return Path.Combine(
               WorkspacesPath,
               workspaceHash
           );
        }

        string GetWorkspaceRootPath(string workspaceHash)
        {
            return Path.Combine(
                GetWorkspacePath(workspaceHash),
                ConfigurationManager.Configuration.Database.Paths.WorkspaceRootFolderPath
            );
        }

        /// <summary>
        /// Creates an absolute path to a document or folder in a workspace so that
        /// it can be accessed.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace containing the document or folder.</param>
        /// <param name="relativePath">The relative path to the document or folder starting at
        /// the workspace root.</param>
        /// <returns>Returns the absolute path.</returns>
        string GetFilePath(string workspaceHash, string relativePath)
            => Path.Combine(GetWorkspaceRootPath(workspaceHash), relativePath);

        string GetUserPath(string userID)
        {
            return Path.Combine(
                UsersPath,
                $"{userID}.json"
            );
        }

        public User? GetUser(string userID)
        {
            try
            {
                using var sr = new StreamReader(GetUserPath(userID));
                string jsonString = sr.ReadToEnd();
                var user = new User(jsonString);
                return user;
            }
            catch
            {
                return null;
            }
        }

        public Roles GetUserWorkspaceRole(string userID, string workspaceHash)
        {
            var user = GetUser(userID);
            Roles role = Roles.None;

            foreach (var workspace in user.Workspaces)
            {
                if (workspace.ID == workspaceHash)
                {
                    role = workspace.Role;
                    break;
                }
            }

            return role;
        }

        public string GetDocumentData(string workspaceHash, string relativePath)
        {
            using var sr = new StreamReader(GetFilePath(workspaceHash, relativePath));
            return sr.ReadToEnd();
        }

        public string GetFileStructurePath(string workspaceHash)
        {
            return Path.Combine(
                WorkspacesPath,
                workspaceHash,
                ConfigurationManager.Configuration.Database.Paths.FileStructurePath
            );
        }

        public FileStructure? GetFileStructure(string workspaceHash)
        {
            try
            {
                using var sr = new StreamReader(GetFileStructurePath(workspaceHash));
                string jsonString = sr.ReadToEnd();
                var fileStructure = new FileStructure(jsonString);
                return fileStructure;
            }
            catch
            {
                return null;
            }
        }

        /// <summary>
        /// Replaces the old file structure with a new one.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace of the file structure.</param>
        /// <param name="fileStructure">The data to be written.</param>
        public void UpdateFileStructure(string workspaceHash, FileStructure fileStructure)
        {
            string jsonString = JsonConvert.SerializeObject(fileStructure);
            using var sw = new StreamWriter(GetFileStructurePath(workspaceHash));
            sw.Write(jsonString);
        }

        /// <summary>
        /// Attempts to create a document.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace in which to create the document.</param>
        /// <param name="relativePath">The path of the document.</param>
        /// <returns>Returns whether the document was created successfully.</returns>
        public bool CreateDocument(string workspaceHash, string relativePath)
        {
            string absolutePath = GetFilePath(workspaceHash, relativePath);
            try
            {
                var fs = System.IO.File.Create(absolutePath);
                fs.Close();
                return true;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Attempts to create a folder.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace in which to create the folder.</param>
        /// <param name="relativePath">The path of the folder.</param>
        /// <returns>Returns whether the folder was created successfully.</returns>
        public bool CreateFolder(string workspaceHash, string relativePath)
        {
            string absolutePath = GetFilePath(workspaceHash, relativePath);
            try
            {
                System.IO.Directory.CreateDirectory(absolutePath);
                return true;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Attempts to delete a document.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace in which to delete the document.</param>
        /// <param name="relativePath">The path of the document.</param>
        /// <returns>Returns whether the document was deleted successfully.</returns>
        public bool DeleteDocument(string workspaceHash, string relativePath)
        {
            string absolutePath = GetFilePath(workspaceHash, relativePath);
            try
            {
                System.IO.File.Delete(absolutePath);
                return true;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Attempts to delete a folder.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace in which to delete the folder.</param>
        /// <param name="relativePath">The path of the folder.</param>
        /// <returns>Returns whether the folder was deleted successfully.</returns>
        public bool DeleteFolder(string workspaceHash, string relativePath)
        {
            string absolutePath = GetFilePath(workspaceHash, relativePath);
            try
            {
                System.IO.Directory.Delete(absolutePath, true);
                return true;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Attempts to rename a document or folder.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace in which to rename the file.</param>
        /// <param name="oldRelativePath">The path to the file.</param>
        /// <param name="newRelativePath">The new path to the file.</param>
        /// <returns>Returns whether the file was deleted successfully.</returns>
        public bool RenameFile(string workspaceHash, string oldRelativePath, string newRelativePath)
        {
            string oldAbsolutePath = GetFilePath(workspaceHash, oldRelativePath);
            string newAbsolutePath = GetFilePath(workspaceHash, newRelativePath);
            try
            {
                ///TODO: test if this works on folders
                System.IO.File.Move(oldAbsolutePath, newAbsolutePath);
                return true;    
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Attempts to write data to a document. The original document content is overwritten.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace containing the document.</param>
        /// <param name="relativePath">The path of the document.</param>
        /// <param name="documentRows"></param>
        /// <returns>Returns whether the file was modified successfully.</returns>
        public bool WriteDocumentData(string workspaceHash, string relativePath, List<string> documentRows)
        {
            try
            {
                string absolutePath = GetFilePath(workspaceHash, relativePath);
                using var sw = new StreamWriter(absolutePath);
                foreach (string row in documentRows)
                {
                    sw.WriteLine(row);
                }
                return true;
            }
            catch {
                return false;
            }
        }

        /// <summary>
        /// Adds a workspace entry to a user.
        /// </summary>
        /// <param name="userID">The ID of the user.</param>
        /// <param name="workspaceHash">The hash of the workspace.</param>
        /// <param name="workspaceName">The name of the workspace.</param>
        /// <param name="role">The role the user has in the workspace.</param>
        /// <returns></returns>
        public bool AddUserWorkspace(string userID, string workspaceHash, string workspaceName, Roles role)
        {
            var user = GetUser(userID);
            bool workspacePresent = user.Workspaces.Any((workspace) => workspace.ID == workspaceHash);

            if (workspacePresent)
                return true;

            var workspace = new Parsers.DatabaseParsers.Workspace {
                ID = workspaceHash,
                Name = workspaceName,
                Role = role
            };
            user.Workspaces.Add(workspace);

            try
            {
                string jsonString = JsonConvert.SerializeObject(user);
                using var sw = new StreamWriter(GetUserPath(userID));
                sw.Write(jsonString);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public bool RemoveUserWorkspace(string userID, string workspaceHash)
        {
            var user = GetUser(userID);
            int workspaceIdx = user.Workspaces.FindIndex((workspace) => workspace.ID == workspaceHash);

            if (workspaceIdx == -1)
                throw new InvalidOperationException("Attempting to delete a workspace that is not present.");

            user.Workspaces.RemoveAt(workspaceIdx);

            try
            {
                string jsonString = JsonConvert.SerializeObject(user);
                using var sw = new StreamWriter(GetUserPath(userID));
                sw.Write(jsonString);
                return true;
            }
            catch
            {
                return false;
            }
        }

        string GetWorkspaceID(string workspaceName, string ownerID)
        {
            var sb = new StringBuilder();

            using (SHA256 sha256 = SHA256.Create())
            {
                Encoding enc = Encoding.UTF8;
                string hashInput = workspaceName + ownerID
                    + ConfigurationManager.Configuration.Database.WorkspaceHashSalt;
                byte[] bytes = sha256.ComputeHash(enc.GetBytes(hashInput));

                foreach (byte b in bytes)
                {
                    sb.Append(b.ToString("x2"));
                }
            }

            return sb.ToString();
        }

        public bool CreateWorkspace(string ownerID, string name)
        {
            try
            {
                string workspaceID = GetWorkspaceID(name, ownerID);

                string workspacePath = GetWorkspacePath(workspaceID);

                // create workspace folder
                System.IO.Directory.CreateDirectory(workspacePath);
                // create root folder
                System.IO.Directory.CreateDirectory(GetWorkspaceRootPath(workspaceID));

                var defaultFileStructure = FileStructure.GetDefault(name);
                var defaultUsers = WorkspaceUsers.GetDefault(ownerID);

                // create structure.json file
                UpdateFileStructure(workspaceID, defaultFileStructure);

                // create users.json file
                UpdateWorkspaceUsers(workspaceID, defaultUsers);

                // add workspace entry to owner
                // this is added last so that all workspaces listed in user config are valid
                AddUserWorkspace(ownerID, workspaceID, name, Roles.Owner);

                return true;
            }
            catch
            {
                return false;
            }
        }

        public bool DeleteWorkspace(string workspaceHash)
        {
            try
            {
                string workspacePath = GetWorkspacePath(workspaceHash);

                // get all user IDs
                var workspaceUsers = GetWorkspaceUsers(workspaceHash);
                var userIDs = workspaceUsers.Users.Keys.ToArray();

                // remove user entries
                foreach (string userID in userIDs)
                    RemoveUserWorkspace(userID, workspaceHash);

                // remove workspace folder
                System.IO.Directory.Delete(workspacePath, true);

                return true;
            }
            catch
            {
                return false;
            }
        }

        string GetWorkspaceUsersPath(string workspaceHash)
        {
            return Path.Combine(
                WorkspacesPath,
                workspaceHash,
                ConfigurationManager.Configuration.Database.Paths.WorkspaceUsersPath
            );
        }

        public WorkspaceUsers GetWorkspaceUsers(string workspaceHash)
        {
            string path = GetWorkspaceUsersPath(workspaceHash);

            using var sr = new StreamReader(path);
            string jsonString = sr.ReadToEnd();
            var workspaceUsers = new WorkspaceUsers(jsonString);
            return workspaceUsers;
        }

        public void UpdateWorkspaceUsers(string workspaceHash, WorkspaceUsers workspaceUsers)
        {
            string jsonString = JsonConvert.SerializeObject(workspaceUsers);
            using var sw = new StreamWriter(GetWorkspaceUsersPath(workspaceHash));
            sw.Write(jsonString);
        }
    }
}
