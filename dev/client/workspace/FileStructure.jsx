const React = require('react');
const FileStructureFolder = require('./FileStructureFolder');
const FileOperation = require('./FileOperation');
const fsOps = require('../../lib/fileStructureOps');
const msgFactory = require('../../lib/clientMessageFactory');
const DivergenceSolver = require('./ErrorComponents/DivergenceSolver');

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
    this.deleteFile();
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

    const parentID = fsOps.getSpawnParentID(
      this.props.fileStructure, this.props.pathMap, this.props.activeFile,
    );
    const message = msgFactory.createDocument(parentID, name);
    this.props.sendMessageToServer(JSON.stringify(message));
  }

  createFolder(name) {
    this.setState({ toSpawnFolder: null });

    const parentID = fsOps.getSpawnParentID(
      this.props.fileStructure, this.props.pathMap, this.props.activeFile ?? 0, /// TODO: default fileID should not be a literal here
    );
    const message = msgFactory.createFolder(parentID, name);
    this.props.sendMessageToServer(JSON.stringify(message));
  }

  renameFile(newName) {
    this.setState({ toBeRenamed: null });

    const name = fsOps.getFileNameFromID(
      this.props.fileStructure, this.props.pathMap, this.props.activeFile,
    );
    if (name !== newName) {
      const message = msgFactory.renameFile(this.props.activeFile, newName);
      this.props.sendMessageToServer(JSON.stringify(message));
    }
  }

  deleteDocument() {
    const message = msgFactory.deleteDocument(this.props.activeFile);
    this.props.sendMessageToServer(JSON.stringify(message));
  }

  deleteFolder() {
    const message = msgFactory.deleteFolder(this.props.activeFile);
    this.props.sendMessageToServer(JSON.stringify(message));
  }

  deleteFile() {
    const fileObj = fsOps.getFileObject(
      this.props.fileStructure, this.props.pathMap, this.props.activeFile,
    );
    if (fileObj !== null && fileObj.type === fsOps.types.document) {
      this.deleteDocument();
    }
    else if (fileObj !== null && fileObj.type === fsOps.types.folder) {
      this.deleteFolder();
    }
    else {
      console.log('Deleting unknown file:', fileObj);
    }
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
    let diverged = this.props.activeFile !== null
      && this.props.divergedDocuments.has(this.props.activeFile);

    return (
      <div>
        <div className="fileOperations">
          <FileOperation key="a" text="+doc" func={this.onCreateDocument} />
          <FileOperation key="b" text="+folder" func={this.onCreateFolder} />
          <FileOperation key="c" text="rename" func={this.onRenameFile} />
          <FileOperation key="d" text="delete" func={this.onDeleteFile} />
        </div>
        {
        !diverged ? null :
          <DivergenceSolver
            func={() => this.props.forceDocument(this.props.activeFile)}
            userCanEdit={this.props.userCanEdit}
          />
        }
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

module.exports = FileStructure;
