class FileStructure extends React.Component {
    constructor(props) {
        super(props);
        this.onCreateDocument = this.onCreateDocument.bind(this);
        this.onCreateFolder = this.onCreateFolder.bind(this);
        this.onDeleteFile = this.onDeleteFile.bind(this);
        this.onRenameFile = this.onRenameFile.bind(this);
        this.createDocument = this.createDocument.bind(this);
        this.createFolder = this.createFolder.bind(this);
        this.renameFile = this.renameFile.bind(this);
        this.state = {
            toSpawnDocument: null, // file ID of a folder that shall spawn a EditableFile element
            toSpawnFolder: null, // file ID of a folder that shall spawn a EditableFile element
            toBeRenamed: null // file ID of a file that shall be replaced with a EditableFile element
        }
    }

    // callbacks for FileOperation components
    onCreateDocument() {
        this.setState({toSpawnDocument: this.props.activeFile});
    }
    onCreateFolder() {
        this.setState({toSpawnFolder: this.props.activeFile});
    }
    onDeleteFile() {
        this.props.deleteFile();
    }
    onRenameFile() {
        console.log("rename FS");
        this.setState({toBeRenamed: this.props.activeFile});
    }

    // callbacks for FileStructure components
    createDocument(name) {
        this.setState({toSpawnDocument: null});
        this.props.createDocument(name);
    }
    createFolder(name) {
        this.setState({toSpawnFolder: null});
        this.props.createFolder(name);

    }
    renameFile(newName) {
        this.setState({toBeRenamed: null});
        this.props.renameFile(newName);
    }

    render() {
        return (
            <div id="fileStructure">
                <div className="fileOperations">
                    <FileOperation key="a" text="+doc" func={this.onCreateDocument} />
                    <FileOperation key="b" text="+folder" func={this.onCreateFolder} />
                    <FileOperation key="c" text="rename" func={this.onRenameFile} />
                    <FileOperation key="d" text="delete" func={this.onDeleteFile} />
                </div>
                <FileStructureFolder
                    fileID="0"
                    name="Workspace Name" 
                    items={this.props.fileStructure === null ? null : this.props.fileStructure.items} 
                    activeFile={this.props.activeFile}
                    toSpawnDocument={this.state.toSpawnDocument}
                    toSpawnFolder={this.state.toSpawnFolder}
                    toBeRenamed={this.state.toBeRenamed}
                    selectFile={this.props.selectFile}
                    createDocument={this.createDocument}
                    createFolder={this.createFolder}
                    renameFile={this.renameFile}
                />
            </div>
        );
    }
}
