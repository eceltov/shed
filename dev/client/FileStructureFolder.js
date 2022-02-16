class FileStructureFolder extends React.Component {
    constructor(props) {
        super(props);
        this.handleOnChange = this.handleOnChange.bind(this);
        this.createEditableFile = this.createEditableFile.bind(this);
        this.getULClassName = this.getULClassName.bind(this);
        this.shouldBeChecked = this.shouldBeChecked.bind(this);
        this.state = {
            checked: this.props.fileID == 0
        }
    }

    handleOnChange(e) {
        this.props.selectFile(this.props.fileID);
        this.setState({
            checked: e.target.checked
        });
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
                abortFileOp={this.props.abortFileOp}
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
                abortFileOp={this.props.abortFileOp}
            />
        );
    }

    createEditableFile(callback, name) {
        return (
            <li>
                <EditableFile key={this.props.fileID + "b"} abortFileOp={this.props.abortFileOp} onFinalize={callback} name={name} />
            </li>
        );
    }

    shouldBeChecked() {
        return this.state.checked || this.props.toSpawnDocument === this.props.fileID || this.props.toSpawnFolder === this.props.fileID;
    }

    getULClassName() {
        if (this.shouldBeChecked()) {
            return "";
        }
        return "hidden";
    }

    createStandardFolderContent() {
        return (
            <li>
                <input type="checkbox" id={this.props.fileID} onChange={this.handleOnChange} className="folder" checked={this.shouldBeChecked()} /> 
                <label htmlFor={this.props.fileID} className={this.props.activeFile === this.props.fileID ? "active" : ""}>{this.props.name}</label>   
                <ul className={this.getULClassName()} >
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
                {this.createEditableFile(this.props.renameFile, this.props.name)}
                <ul className={this.getULClassName()}>
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
