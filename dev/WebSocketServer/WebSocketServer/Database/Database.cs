using Newtonsoft.Json;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using WebSocketServer.Configuration;
using WebSocketServer.Model;
using WebSocketServer.Parsers.DatabaseParsers;

namespace WebSocketServer.Database
{
    internal class Database : IDatabase
    {
        string workspacesPath { get; set; }
        string usersPath { get; set; }

        // lock collections used for thread-safe file manipulation and access
        // key: userID
        FileLocker<string> userLocker = new();
        // key: absolute filePath
        FileLocker<string> documentAndFolderLocker = new();
        // key: workspaceID
        FileLocker<string> fileStructureLocker = new();
        // key: workspaceID
        FileLocker<string> workspaceMetaLocker = new();


        public Database()
        {
            workspacesPath = Path.Combine(
                EnvironmentVariables.DataPath,
                ConfigurationManager.Configuration.Database.Paths.WorkspacesPath
            );

            usersPath = Path.Combine(
                EnvironmentVariables.DataPath,
                ConfigurationManager.Configuration.Database.Paths.UsersPath
            );
        }

        string GetWorkspacePath(string workspaceHash)
        {
            return Path.Combine(
               workspacesPath,
               workspaceHash
           );
        }

        string GetUsernameToIdMapPath()
        {
            return Path.Combine(
               usersPath,
               "../usernameToIdMap.json"
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
                usersPath,
                $"{userID}.json"
            );
        }

        public async Task<User?> GetUserAsync(string userID)
        {
            try
            {
                await userLocker.WaitAsync(userID);
                return await GetUserLocklessAsync(userID);
            }
            catch
            {
                return null;
            }
            finally
            {
                userLocker.Release(userID);
            }
        }

        async Task<User?> GetUserLocklessAsync(string userID)
        {
            try
            {
                using var sr = new StreamReader(GetUserPath(userID));
                string jsonString = await sr.ReadToEndAsync();
                var user = new User(jsonString);
                return user;
            }
            catch
            {
                return null;
            }
        }

        public async Task<Roles> GetUserWorkspaceRoleAsync(string userID, string workspaceHash)
        {
            var user = await GetUserAsync(userID);
            Roles role = Roles.None;

            if (user == null)
                return role;

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

        public async Task<string?> GetDocumentDataAsync(string workspaceHash, string relativePath)
        {
            string filePath = GetFilePath(workspaceHash, relativePath);
            await documentAndFolderLocker.WaitAsync(filePath);
            try
            {
                using var sr = new StreamReader(filePath);
                return await sr.ReadToEndAsync();
            }
            catch
            {
                return null;
            }
            finally
            {
                documentAndFolderLocker.Release(filePath);
            }
        }

        public string GetFileStructurePath(string workspaceHash)
        {
            return Path.Combine(
                workspacesPath,
                workspaceHash,
                ConfigurationManager.Configuration.Database.Paths.FileStructurePath
            );
        }

        public async Task<FileStructure?> GetFileStructureAsync(string workspaceHash)
        {
            await fileStructureLocker.WaitAsync(workspaceHash);
            string path = GetFileStructurePath(workspaceHash);
            try
            {
                using var sr = new StreamReader(path);
                string jsonString = await sr.ReadToEndAsync();
                var fileStructure = new FileStructure(jsonString);
                return fileStructure;
            }
            catch
            {
                return null;
            }
            finally
            {
                fileStructureLocker.Release(workspaceHash);
            }
        }

        /// <summary>
        /// Replaces the old file structure with a new one.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace of the file structure.</param>
        /// <param name="fileStructure">The data to be written.</param>
        public async Task<bool> UpdateFileStructureAsync(string workspaceHash, FileStructure fileStructure)
        {
            var asyncLock = fileStructureLocker.WaitAsync(workspaceHash);

            try
            {
                string jsonString = JsonConvert.SerializeObject(fileStructure);
                await asyncLock;
                using var sw = new StreamWriter(GetFileStructurePath(workspaceHash));
                await sw.WriteAsync(jsonString);

                return true;
            }
            catch
            {
                return false;
            }
            finally
            {
                fileStructureLocker.Release(workspaceHash);
            }
        }

        /// <summary>
        /// Attempts to create a document.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace in which to create the document.</param>
        /// <param name="relativePath">The path of the document.</param>
        /// <returns>Returns whether the document was created successfully.</returns>
        public async Task<bool> CreateDocumentAsync(string workspaceHash, string relativePath)
        {
            string absolutePath = GetFilePath(workspaceHash, relativePath);
            await documentAndFolderLocker.WaitAsync(absolutePath);
            try
            {
                await Task.Run(() =>
                {
                    var fs = System.IO.File.Create(absolutePath);
                    fs.Close();
                });
                
                return true;
            }
            catch
            {
                return false;
            }
            finally
            {
                documentAndFolderLocker.Release(absolutePath);
            }
        }

        /// <summary>
        /// Attempts to create a folder.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace in which to create the folder.</param>
        /// <param name="relativePath">The path of the folder.</param>
        /// <returns>Returns whether the folder was created successfully.</returns>
        public async Task<bool> CreateFolderAsync(string workspaceHash, string relativePath)
        {
            string absolutePath = GetFilePath(workspaceHash, relativePath);
            await documentAndFolderLocker.WaitAsync(absolutePath);
            try
            {
                await Task.Run(() =>
                {
                    System.IO.Directory.CreateDirectory(absolutePath);
                });

                return true;
            }
            catch
            {
                return false;
            }
            finally
            {
                documentAndFolderLocker.Release(absolutePath);
            }
        }

        /// <summary>
        /// Attempts to delete a document.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace in which to delete the document.</param>
        /// <param name="relativePath">The path of the document.</param>
        /// <returns>Returns whether the document was deleted successfully.</returns>
        public async Task<bool> DeleteDocumentAsync(string workspaceHash, string relativePath)
        {
            string absolutePath = GetFilePath(workspaceHash, relativePath);
            await documentAndFolderLocker.WaitAsync(absolutePath);
            try
            {
                await Task.Run(() =>
                {
                    System.IO.File.Delete(absolutePath);
                });

                return true;
            }
            catch
            {
                return false;
            }
            finally
            {
                documentAndFolderLocker.Release(absolutePath);
            }
        }

        /// <summary>
        /// Attempts to delete a folder.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace in which to delete the folder.</param>
        /// <param name="relativePath">The path of the folder.</param>
        /// <returns>Returns whether the folder was deleted successfully.</returns>
        public async Task<bool> DeleteFolderAsync(string workspaceHash, string relativePath)
        {
            string absolutePath = GetFilePath(workspaceHash, relativePath);
            await documentAndFolderLocker.WaitAsync(absolutePath);
            try
            {
                await Task.Run(() =>
                {
                    System.IO.Directory.Delete(absolutePath, true);
                });

                return true;
            }
            catch
            {
                return false;
            }
            finally
            {
                documentAndFolderLocker.Release(absolutePath);
            }
        }

        /// <summary>
        /// Attempts to rename a document or folder.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace in which to rename the file.</param>
        /// <param name="oldRelativePath">The path to the file.</param>
        /// <param name="newRelativePath">The new path to the file.</param>
        /// <returns>Returns whether the file was deleted successfully.</returns>
        public async Task<bool> RenameFileAsync(string workspaceHash, string oldRelativePath, string newRelativePath)
        {
            string oldAbsolutePath = GetFilePath(workspaceHash, oldRelativePath);
            string newAbsolutePath = GetFilePath(workspaceHash, newRelativePath);

            // when two files swap names at the same time, the FileStructure will not allow it,
            // meaning that the situation will not produce two database calls
            await documentAndFolderLocker.WaitAsync(oldAbsolutePath);

            ///TODO: renaming a file will make all operations targeting the file with the old name invalid

            try
            {
                await Task.Run(() =>
                {
                    FileAttributes attributes = System.IO.File.GetAttributes(oldAbsolutePath);
                    if (attributes.HasFlag(FileAttributes.Directory))
                        System.IO.Directory.Move(oldAbsolutePath, newAbsolutePath);
                    else
                        System.IO.File.Move(oldAbsolutePath, newAbsolutePath);
                });
                
                return true;    
            }
            catch
            {
                return false;
            }
            finally
            {
                documentAndFolderLocker.Release(oldAbsolutePath);
            }
        }

        /// <summary>
        /// Attempts to write data to a document. The original document content is overwritten.
        /// </summary>
        /// <param name="workspaceHash">The hash of the workspace containing the document.</param>
        /// <param name="relativePath">The path of the document.</param>
        /// <param name="documentRows"></param>
        /// <returns>Returns whether the file was modified successfully.</returns>
        public async Task<bool> WriteDocumentDataAsync(string workspaceHash, string relativePath, List<string> documentRows)
        {
            string absolutePath = GetFilePath(workspaceHash, relativePath);
            await documentAndFolderLocker.WaitAsync(absolutePath);

            try
            {
                await Task.Run(() =>
                {
                    using var sw = new StreamWriter(absolutePath);
                    foreach (string row in documentRows)
                    {
                        sw.WriteLine(row);
                    }
                });

                return true;
            }
            catch
            {
                return false;
            }
            finally
            {
                documentAndFolderLocker.Release(absolutePath);
            }
        }

        /// <summary>
        /// Adds a workspace entry to a user.
        /// If already present, changes the role instead.
        /// </summary>
        /// <param name="userID">The ID of the user.</param>
        /// <param name="workspaceHash">The hash of the workspace.</param>
        /// <param name="workspaceName">The name of the workspace.</param>
        /// <param name="role">The role the user has in the workspace.</param>
        /// <returns>Returns whether the operation succeeded.</returns>
        public async Task<bool> AddUserWorkspaceAsync(string userID, string workspaceHash, string workspaceName, Roles role)
        {
            await userLocker.WaitAsync(userID);
            var user = await GetUserLocklessAsync(userID);

            try
            {

                if (user == null)
                return false;

                var foundWorkspace = user.Workspaces.Find((workspace) => workspace.ID == workspaceHash);

                // change the role to the one provided
                if (foundWorkspace != null)
                {
                    foundWorkspace.Role = role;
                    // remove the workspace if the role is None
                    if (role == Roles.None)
                    {
                        user.Workspaces.Remove(foundWorkspace);
                    }
                }
                else
                {
                    var workspace = new Parsers.DatabaseParsers.Workspace
                    {
                        ID = workspaceHash,
                        Name = workspaceName,
                        Role = role
                    };
                    user.Workspaces.Add(workspace);
                }

                string jsonString = JsonConvert.SerializeObject(user);
                using var sw = new StreamWriter(GetUserPath(userID));
                await sw.WriteAsync(jsonString);
                return true;
            }
            catch
            {
                return false;
            }
            finally
            {
                userLocker.Release(userID);
            }
        }

        public async Task<bool> RemoveUserWorkspaceAsync(string userID, string workspaceHash)
        {
            await userLocker.WaitAsync(userID);
            var user = await GetUserLocklessAsync(userID);

            if (user == null)
                return false;

            try
            {
                await Task.Run(() =>
                {
                    int workspaceIdx = user.Workspaces.FindIndex((workspace) => workspace.ID == workspaceHash);

                    if (workspaceIdx == -1)
                        throw new InvalidOperationException("Attempting to delete a workspace that is not present.");

                    user.Workspaces.RemoveAt(workspaceIdx);

                    string jsonString = JsonConvert.SerializeObject(user);
                    using var sw = new StreamWriter(GetUserPath(userID));
                    sw.Write(jsonString);
                });

                return true;
            }
            catch
            {
                return false;
            }
            finally
            {
                userLocker.Release(userID);
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

        public async Task<bool> CreateWorkspaceAsync(string ownerID, string name)
        {
            // no locking of files is done, as no operations can access the files yet
            try
            {
                string workspaceID = GetWorkspaceID(name, ownerID);

                string workspacePath = GetWorkspacePath(workspaceID);

                await Task.Run(() =>
                {
                    // create workspace folder
                    System.IO.Directory.CreateDirectory(workspacePath);
                    // create root folder
                    System.IO.Directory.CreateDirectory(GetWorkspaceRootPath(workspaceID));
                });

                var defaultFileStructure = FileStructure.GetDefault(name);
                var defaultUsers = WorkspaceUsers.GetDefault(ownerID);

                // create structure.json file
                await UpdateFileStructureAsync(workspaceID, defaultFileStructure);

                // create users.json file
                await UpdateWorkspaceUsersAsync(workspaceID, defaultUsers);

                // add workspace entry to owner
                // this is added last so that all workspaces listed in user config are valid
                await AddUserWorkspaceAsync(ownerID, workspaceID, name, Roles.Owner);

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
                workspacesPath,
                workspaceHash,
                ConfigurationManager.Configuration.Database.Paths.WorkspaceUsersPath
            );
        }

        string GetWorkspaceConfigPath(string workspaceHash)
        {
            return Path.Combine(
                workspacesPath,
                workspaceHash,
                ConfigurationManager.Configuration.Database.Paths.WorkspaceConfigPath
            );
        }

        public async Task<WorkspaceUsers?> GetWorkspaceUsersAsync(string workspaceHash)
        {
            string path = GetWorkspaceUsersPath(workspaceHash);
            await workspaceMetaLocker.WaitAsync(workspaceHash);

            try
            {
                using var sr = new StreamReader(path);
                string jsonString = await sr.ReadToEndAsync();
                var workspaceUsers = new WorkspaceUsers(jsonString);
                return workspaceUsers;
            }
            catch
            {
                return null;
            }
            finally
            {
                workspaceMetaLocker.Release(workspaceHash);
            }
        }

        public async Task<bool> UpdateWorkspaceUsersAsync(string workspaceHash, WorkspaceUsers workspaceUsers)
        {
            string jsonString = JsonConvert.SerializeObject(workspaceUsers.Users);
            await workspaceMetaLocker.WaitAsync(workspaceHash);

            try
            {
                using var sw = new StreamWriter(GetWorkspaceUsersPath(workspaceHash));
                await sw.WriteAsync(jsonString);

                return true;
            }
            catch
            {
                return false;
            }
            finally
            {
                workspaceMetaLocker.Release(workspaceHash);
            }
        }

        public async Task<WorkspaceConfig?> GetWorkspaceConfigAsync(string workspaceHash)
        {
            await workspaceMetaLocker.WaitAsync(workspaceHash);

            try
            {
                return await GetWorkspaceConfigLocklessAsync(workspaceHash);
            }
            catch
            {
                return null;
            }
            finally
            {
                workspaceMetaLocker.Release(workspaceHash);
            }
        }

        async Task<WorkspaceConfig?> GetWorkspaceConfigLocklessAsync(string workspaceHash)
        {
            string path = GetWorkspaceConfigPath(workspaceHash);

            try
            {
                using var sr = new StreamReader(path);
                string jsonString = await sr.ReadToEndAsync();
                var workspaceConfig = new WorkspaceConfig(jsonString);
                return workspaceConfig;
            }
            catch
            {
                return null;
            }
        }

        public async Task<bool> UpdateWorkspaceConfigAsync(string workspaceHash, WorkspaceConfig workspaceConfig)
        {
            await workspaceMetaLocker.WaitAsync(workspaceHash);

            try
            {
                return await UpdateWorkspaceConfigLocklessAsync(workspaceHash, workspaceConfig);
            }
            catch
            {
                return false;
            }
            finally
            {
                workspaceMetaLocker.Release(workspaceHash);
            }
        }

        async Task<bool> UpdateWorkspaceConfigLocklessAsync(string workspaceHash, WorkspaceConfig workspaceConfig)
        {
            string jsonString = JsonConvert.SerializeObject(workspaceConfig);

            try
            {
                using var sw = new StreamWriter(GetWorkspaceConfigPath(workspaceHash));
                await sw.WriteAsync(jsonString);

                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> ChangeWorkspaceAccessTypeAsync(string workspaceHash, WorkspaceAccessTypes accessType)
        {
            await workspaceMetaLocker.WaitAsync(workspaceHash);

            try
            {
                if (await GetWorkspaceConfigLocklessAsync(workspaceHash) is not WorkspaceConfig config)
                {
                    Console.Write($"Error in {nameof(ChangeWorkspaceAccessTypeAsync)}: Config not found.");
                    return false;
                }

                config.AccessType = accessType;

                if (!await UpdateWorkspaceConfigLocklessAsync(workspaceHash, config))
                {
                    Console.Write($"Error in {nameof(ChangeWorkspaceAccessTypeAsync)}: Config could not be updated.");
                    return false;
                }

                return true;
            }
            catch
            {
                return false;
            }
            finally
            {
                workspaceMetaLocker.Release(workspaceHash);
            }
        }

        public async Task<UsernameToIdMap?> GetUsernameToIdMapAsync()
        {
            try
            {
                using var sr = new StreamReader(GetUsernameToIdMapPath());
                string jsonString = await sr.ReadToEndAsync();
                var usernameToIdMap = new UsernameToIdMap(jsonString);
                return usernameToIdMap;
            }
            catch
            {
                return null;
            }
        }

        public async Task<string?> GetUsernameFromIDAsync(string username)
        {
            if (await GetUsernameToIdMapAsync() is not UsernameToIdMap map)
                return null;

            if (!map.Entries.ContainsKey(username))
            {
                Console.Write($"Error in {nameof(GetUsernameFromIDAsync)}: Username not found.");
                return null;
            }

            return map.Entries[username];
        }

        public async Task<User?> GetUserByUsernameAsync(string username)
        {
            if (await GetUsernameFromIDAsync(username) is not string userID)
                return null;

            if (await GetUserAsync(userID) is not User user)
            {
                Console.Write($"Error in {nameof(GetUserByUsernameAsync)}: User not found.");
                return null;
            }

            return user;
        }

        public async Task<bool> AddUserToWorkspaceAsync(string workspaceHash, string workspaceName, string username, Roles role)
        {
            // find userID
            if (await GetUsernameFromIDAsync(username) is not string userID)
                return false;

            // add entry to user workspaces list
            await AddUserWorkspaceAsync(userID, workspaceHash, workspaceName, role);

            // add entry to workspace users dict
            if (await GetWorkspaceUsersAsync(workspaceHash) is not WorkspaceUsers workspaceUsers)
                return false;

            workspaceUsers.Users[userID] = (int)role;

            if (!await UpdateWorkspaceUsersAsync(workspaceHash, workspaceUsers))
                return false;

            return true;
        }
    }
}
