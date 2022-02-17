class Tab extends React.Component {
  constructor(props) {
    super(props);
    this.handleTabClick = this.handleTabClick.bind(this);
    this.handleCrossClick = this.handleCrossClick.bind(this);
    this.getClassName = this.getClassName.bind(this);
  }

  handleTabClick(e) {
    this.props.openDocument(this.props.fileID);
  }

  handleCrossClick(e) {
    e.preventDefault(); // stop propagating the click
    this.props.closeDocument(this.props.fileID);
  }

  getClassName() {
    let className = 'tab';
    if (this.props.active) {
      className += ' tabActive';
    }
    if (this.props.rightmost) {
      className += ' tabRightmost';
    }
    return className;
  }

  render() {
    return (
      <div className={this.getClassName()}>
        <div className="tabContent" role="button" tabIndex={0} onClick={this.handleTabClick}>
          {this.props.name}
        </div>
        <div className="tabClose" role="button" tabIndex={0} onClick={this.handleCrossClick} />
      </div>

    );
  }
}
