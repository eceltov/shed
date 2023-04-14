using System;
using System.Globalization;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace WebSocketServer.Parsers.DatabaseParsers
{
    public enum FileTypes
    {
        Document = 0,
        Folder = 1
    }

    [JsonConverter(typeof(FileStructureConverter))]
    public class File
    {
        public File() { }

        public File(File other)
        {
            this.ID = other.ID;
            this.Name = other.Name;
            this.Type = other.Type;
        }

        [JsonProperty("type")] public FileTypes Type { get; set; }
        [JsonProperty("ID")] public int ID { get; set; }
        [JsonProperty("name")] public string Name { get; set; }
    }

    public class Document : File
    {
        public Document() { }

        public Document(File file) : base(file) { }

        public Document(int id, string name)
        {
            ID = id;
            Name = name;
            Type = FileTypes.Document;
        }
    }

    public class Folder : File
    {
        public Folder() { }

        public Folder(File file) : base(file) { }

        public Folder(int id, string name)
        {
            ID = id;
            Name = name;
            Type = FileTypes.Folder;
            Items = new();
        }

        [JsonProperty("items")] public Dictionary<string, File> Items { get; set; }
    }

    public class FileStructure : Folder
    {
        [JsonProperty("nextID")] public int NextID { get; set; }

        /// <summary>
        /// Maps file IDs to their paths in the file structure. The path tokens are file IDs, not their names.
        /// </summary>
        Dictionary<int, string> pathMap;

        const string fileNameRegex = "^[^\\/:*?\"<>|]*$";

        object AddRemoveFileLock = new();

        public FileStructure() { }

        public FileStructure(Folder folder) : base(folder)
        {
            Items = folder.Items;
        }

        public FileStructure(string jsonString)
        {
            var source = JsonConvert.DeserializeObject<FileStructure>(jsonString);
            NextID = source.NextID;
            Type = source.Type;
            ID = source.ID;
            Name = source.Name;
            Items = source.Items;

            InitIDPathMap();
        }

        public static FileStructure GetDefault(string workspaceName)
        {
            FileStructure fileStructure = new()
            {
                NextID = 1,
                Type = FileTypes.Folder,
                ID = 0,
                Name = workspaceName,
                Items = new Dictionary<string, File>()
            };
            fileStructure.InitIDPathMap();

            return fileStructure;
        }

        public static bool ValidateFileName(string name)
        {
            return name != null
                && Regex.IsMatch(name, fileNameRegex)
                && name != ""
                && name != "."
                && name != "..";
        }

        public Document? CreateDocument(int parentID, string name)
        {
            lock (AddRemoveFileLock)
            {
                Document document = new Document(NextID++, name);

                if (AddFile(parentID, document))
                    return document;

                return null;
            }
        }

        public Folder? CreateFolder(int parentID, string name)
        {
            lock (AddRemoveFileLock)
            {
                Folder folder = new Folder(NextID++, name);

                if (AddFile(parentID, folder))
                    return folder;

                return null;
            }
        }

        void InitIDPathMapRecursion(Folder? folder, string parentPath)
        {
            if (folder == null) return;
            foreach (var (stringID, file) in folder.Items)
            {
                string currentPath = parentPath + stringID;
                pathMap.Add(file.ID, currentPath);
                if (file.Type == FileTypes.Folder)
                {
                    string folderPath = $"{currentPath}/";
                    InitIDPathMapRecursion(file as Folder, folderPath);
                }
            }
        }

        void InitIDPathMap()
        {
            pathMap = new();
            string path = "";
            pathMap.Add(ID, path); // path to root
            InitIDPathMapRecursion(this, path);
        }

        public File? GetFileFromPath(string path)
        {
            if (path == null) return null;
            if (path == "")
                return this;

            string[] tokens = path.Split('/');
            Folder currentFolder = this;
            for (int i = 0; i < tokens.Length; i++)
            {
                if (currentFolder.Items[tokens[i]] is Folder folder)
                    currentFolder = folder;
                // if the last token points to a document, return it
                else if (currentFolder.Items[tokens[i]] is Document document && i == tokens.Length - 1)
                    return document;
                // if a document was found before the end of the path, return null
                else
                    return null;
            }
            return currentFolder;
        }

        public File? GetFileFromID(int fileID)
        {
            if (!pathMap.ContainsKey(fileID))
                return null;

            return GetFileFromPath(pathMap[fileID]);
        }

        public Folder? GetParentFolder(int fileID)
        {
            if (!pathMap.ContainsKey(fileID))
                return null;

            // the parent of the root is the root
            if (fileID == ID)
                return this;

            string path = pathMap[fileID];

            int parentFolderEndIndex = path.LastIndexOf('/');
            if (parentFolderEndIndex == -1)
                return this;

            string parentPath = path[0..parentFolderEndIndex];
            return GetFileFromPath(parentPath) as Folder;
        }

        public string? GetFileNameFromPath(string path)
        {
            File? file = GetFileFromPath(path);
            return file?.Name;
        }

        public string? GetFileNameFromID(int fileID)
        {
            File? file = GetFileFromID(fileID);
            return file != null ? file.Name : null;
        }

        public bool CheckIfFolderHasFileName(Folder folder, string name)
        {
            foreach (var (stringID, file) in folder.Items)
            {
                if (file.Name == name)
                    return true;
            }
            return false;
        }

        public bool AddFile(int parentID, File file)
        {
            if (!pathMap.ContainsKey(parentID))
                return false;

            Folder? parent = GetFileFromID(parentID) as Folder;

            if (parent == null || parent.Items.ContainsKey(file.ID.ToString()) || CheckIfFolderHasFileName(parent, file.Name))
                return false;

            parent.Items[file.ID.ToString()] = file;
            string filePath = (parentID == ID ? "" : $"{pathMap[parentID]}/") + file.ID.ToString();
            pathMap.Add(file.ID, filePath);

            return true;
        }

        /// <summary>
        /// Recursively removes paths from PathMap of nested files in a folder.
        /// </summary>
        /// <param name="folder">The folder to be cleansed.</param>
        public void RemoveFileRecursion(Folder folder)
        {
            foreach (var (stringID, file) in folder.Items)
            {
                if (file is Folder nestedFolder)
                    RemoveFileRecursion(folder);
                pathMap.Remove(file.ID);
            }
        }

        /// <summary>
        /// Removes a file from the fileStructure. Updates fileStructure and PathMap.
        /// </summary>
        /// <param name="fileID">The ID of the file to be deleted.</param>
        /// <returns>Returns whether the deletion was successful.</returns>
        public bool RemoveFile(int fileID)
        {
            lock (AddRemoveFileLock)
            {
                if (fileID == ID || !pathMap.ContainsKey(fileID))
                    return false;

                Folder parentFolderObj = GetParentFolder(fileID)!;

                // it is safe to index into items of the parent folder, because fileID !== parentID
                //    due to fileID !== fileStructure.ID and the root folder being the only folder with it as its parent
                File fileObj = parentFolderObj.Items[fileID.ToString()];

                if (fileObj is Folder folder)
                    RemoveFileRecursion(folder);

                pathMap.Remove(fileID);
                parentFolderObj.Items.Remove(fileID.ToString());
                return true;
            }
        }

        public bool RenameFile(int fileID, string newName)
        {
            ///TODO: lock
            if (fileID == ID || !pathMap.ContainsKey(fileID))
                return false;

            Folder parentFolder = GetParentFolder(fileID)!;
            if (CheckIfFolderHasFileName(parentFolder, newName))
                return false;

            // it is safe to index into items of the parent folder, because fileID !== parentID
            //    due to fileID !== fileStructure.ID and the root folder being the only folder with it as its parent
            File file = parentFolder.Items[fileID.ToString()];
            file.Name = newName;
            return true;
        }

        public bool IsDocument(int fileID)
        {
            if (!pathMap.ContainsKey(fileID))
                return false;

            string path = pathMap[fileID];
            return GetFileFromPath(path) is Document;
        }

        /// <summary>
        /// Returns the workspace-relative file path from an ID path.
        /// </summary>
        /// <param name="idPath">The ID path of a file.</param>
        /// <returns>Returns the workspace-relative file path.</returns>
        public string? GetRelativePathFromIDPath(string idPath)
        {
            if (idPath == null)
            {
                Console.WriteLine("Relative path is null!");
                return null;
            }

            string relativePath = "";
            string[] tokens = idPath.Split('/');

            Folder currentFolder = this;
            for (int i = 0; i < tokens.Length - 1; i++)
            {
                if (!currentFolder.Items.ContainsKey(tokens[i]) || currentFolder.Items[tokens[i]] is not Folder folder)
                    return null;

                currentFolder = folder;
                relativePath += $"{currentFolder.Name}/";
            }

            if (!currentFolder.Items.ContainsKey(tokens[^1]))
                return null;

            File lastFile = currentFolder.Items[tokens[^1]];
            return relativePath + lastFile.Name;
        }

        public string? GetRelativePath(int fileID)
        {
            if (!pathMap.ContainsKey(fileID))
            {
                return null;
            }

            return GetRelativePathFromIDPath(pathMap[fileID]);
        }

        /// <param name="fileID">An ID of a document or folder.</param>
        /// <returns>Returns fileID if it points to a folder, else returns the ID of its parent.</returns>
        public int? GetSpawnParentID(int fileID)
        {
            if (GetFileFromID(fileID) is Folder folder)
                return folder.ID;

            if (GetParentFolder(fileID) is Folder parentFolder)
                return parentFolder.ID;

            return null;
        }
    }
}
