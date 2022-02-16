class FileStructureFolder extends React.Component {
    constructor(props) {
        super(props);
        this.handleOnClick = this.handleOnClick.bind(this);
    }

    handleOnClick(e) {
        this.props.selectFile(this.props.fileID);
    }

    createDocument(fileID, name, renamable=false) {
        return (
            <FileStructureDocument
                fileID={fileID} 
                name={name} 
                key={fileID + "a"}  
                renamable={renamable}
                activeFile={this.props.activeFile}
                selectFile={this.props.selectFile}
                renameFile={this.props.renameFile}
            />
        );
    }

    createFolder(fileID, name, items, renamable=false) {
        return (
            <FileStructureFolder
                fileID={fileID} 
                name={name} 
                items={items} 
                key={fileID + "a"} 
                renamable={renamable}
                activeFile={this.props.activeFile}
                toSpawnDocument={this.props.toSpawnDocument}
                toSpawnFolder={this.props.toSpawnFolder}
                toBeRenamed={this.props.toBeRenamed}
                selectFile={this.props.selectFile}
                createDocument={this.props.createDocument}
                createFolder={this.props.createFolder}
                renameFile={this.props.renameFile}
            />
        );
    }

    createEditableFile(callback) {
        return (
            <EditableFile key={this.props.fileID + "b"} onFinalize={callback} />
        );
    }

    createStandardFolderContent() {
        return (
            <li>
                <input type="checkbox" id={this.props.fileID} onClick={this.handleOnClick} className="folder"/> 
                <label htmlFor={this.props.fileID} className={this.props.activeFile === this.props.fileID ? "active" : ""}>{this.props.name}</label>   
                <ul>
                    {this.props.items === null ? null : Object.values(this.props.items).map(fileObj => this.createItem(fileObj))}
                    {this.props.fileID === this.props.toSpawnDocument ? this.createEditableFile(this.props.createDocument) : null}
                    {this.props.fileID === this.props.toSpawnFolder ? this.createEditableFile(this.props.createFolder) : null}
                </ul>
            </li>
        );
    }

    createRenamableFolderContent() {
        return (
            <li>
                <EditableFile onFinalize={this.props.renameFile} /> 
                <ul>
                    {this.props.items === null ? null : Object.entries(this.props.items).map((keyValuePair) => this.createItem(keyValuePair[1], keyValuePair[0]))}
                </ul>
            </li>
        );
    }

    createItem(fileObj) {
        if(fileObj.type === fsOps.types.document) {
            return this.createDocument(fileObj.ID, fileObj.name, fileObj.ID === this.props.toBeRenamed);
        }
        else if (fileObj.type === fsOps.types.folder) {
            return this.createFolder(fileObj.ID, fileObj.name, fileObj.items, fileObj.ID === this.props.toBeRenamed);
        }
        else {
            console.log("Unknown file type:", fileObj.type);
        }
    }

    render() {
        return this.props.renamable ? this.createRenamableFolderContent() : this.createStandardFolderContent();
    }
}
