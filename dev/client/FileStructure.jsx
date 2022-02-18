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
    this.selectFile = this.selectFile.bind(this);
    this.clearState = this.clearState.bind(this);
    this.getContent = this.getContent.bind(this);
    this.state = {
      toSpawnDocument: null, // file ID of a folder that shall spawn a EditableFile element
      toSpawnFolder: null, // file ID of a folder that shall spawn a EditableFile element
      toBeRenamed: null, // file ID of a file that shall be replaced with a EditableFile element
    };
  }

  // callbacks for FileOperation components
  onCreateDocument() {
    const parentID = fsOps.getSpawnParentID(
      this.props.fileStructure, this.props.pathMap, this.props.activeFile,
    );
    this.setSpawnDocument(parentID);
  }

  setSpawnDocument(fileID) {
    if (this.state.toSpawnDocument === fileID) {
      this.clearState();
    }
    else {
      this.setState({
        toSpawnDocument: fileID,
        toSpawnFolder: null,
        toBeRenamed: null,
      });
    }
  }

  /// TODO: this is a copypasta of onCreateDocument
  onCreateFolder() {
    const parentID = fsOps.getSpawnParentID(
      this.props.fileStructure, this.props.pathMap, this.props.activeFile,
    );
    this.setSpawnFolder(parentID);
  }

  setSpawnFolder(fileID) {
    if (this.state.toSpawnFolder === fileID) {
      this.clearState();
    }
    else {
      this.setState({
        toSpawnDocument: null,
        toSpawnFolder: fileID,
        toBeRenamed: null,
      });
    }
  }

  onDeleteFile() {
    this.props.deleteFile();
  }

  onRenameFile() {
    if (this.state.toBeRenamed === this.props.activeFile) {
      this.clearState();
    }
    else {
      this.setState({
        toSpawnDocument: null,
        toSpawnFolder: null,
        toBeRenamed: this.props.activeFile,
      });
    }
  }

  // callbacks for FileStructure components
  createDocument(name) {
    this.setState({ toSpawnDocument: null });
    this.props.createDocument(name);
  }

  createFolder(name) {
    this.setState({ toSpawnFolder: null });
    this.props.createFolder(name);
  }

  renameFile(newName) {
    this.setState({ toBeRenamed: null });
    this.props.renameFile(newName);
  }

  clearState() {
    this.setState({
      toBeRenamed: null,
      toSpawnDocument: null,
      toSpawnFolder: null,
    });
  }

  selectFile(fileID) {
    this.props.selectFile(fileID);
    this.clearState();
  }

  getContent() {
    if (this.props.fileStructure === null) {
      return (
        <div className="waitingMessage">
          Waiting on server...
        </div>
      );
    }

    return (
      <div>
        <div className="fileOperations">
          <FileOperation key="a" text="+doc" func={this.onCreateDocument} />
          <FileOperation key="b" text="+folder" func={this.onCreateFolder} />
          <FileOperation key="c" text="rename" func={this.onRenameFile} />
          <FileOperation key="d" text="delete" func={this.onDeleteFile} />
        </div>
        <FileStructureFolder
          fileID={this.props.fileStructure.ID}
          name={this.props.fileStructure.name}
          items={this.props.fileStructure.items}
          activeFile={this.props.activeFile}
          toSpawnDocument={this.state.toSpawnDocument}
          toSpawnFolder={this.state.toSpawnFolder}
          toBeRenamed={this.state.toBeRenamed}
          selectFile={this.selectFile}
          createDocument={this.createDocument}
          createFolder={this.createFolder}
          renameFile={this.renameFile}
          abortFileOp={this.clearState}
        />
      </div>
    );
  }

  render() {
    return (
      <div id="fileStructure">
        {this.getContent()}
      </div>
    );
  }
}
