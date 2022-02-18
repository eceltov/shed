class FileStructureDocument extends React.Component {
  constructor(props) {
    super(props);
    this.handleOnClick = this.handleOnClick.bind(this);
  }

  handleOnClick(e) {
    const fileID = this.props.fileID;
    this.props.selectFile(fileID);
  }

  createRenamableDocumentContent() {
    return (
      <li>
        <EditableFile
          onFinalize={this.props.renameFile}
          abortFileOp={this.props.abortFileOp}
          name={this.props.name}
        />
      </li>
    );
  }

  createStandardDocumentContent() {
    return (
      <li
        onClick={this.handleOnClick}
        className={`document${this.props.activeFile === this.props.fileID ? ' active' : ''}`}
      >
        {this.props.name}
      </li>
    );
  }

  render() {
    return this.props.renamable
      ? this.createRenamableDocumentContent()
      : this.createStandardDocumentContent();
  }
}
