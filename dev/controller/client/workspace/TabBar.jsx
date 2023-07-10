const React = require('react');
const Tab = require('./Tab');
const fsOps = require('../../lib/fileStructureOps');

class TabBar extends React.Component {
  constructor(props) {
    super(props);
    this.createTab = this.createTab.bind(this);
  }

  createTab(fileID, index) {
    return (
      <Tab
        key={`${fileID}T`}
        fileID={fileID}
        active={fileID === this.props.activeTab}
        name={fsOps.getFileNameFromPath(this.props.fileStructure, this.props.pathMap.get(fileID))}
        openDocument={this.props.openDocument}
        closeDocument={this.props.closeDocument}
        rightmost={index === this.props.tabs.length - 1}
      />
    );
  }

  render() {
    return (
      <div className="tabBar">
        {this.props.tabs.map((fileID, index) => this.createTab(fileID, index))}
      </div>
    );
  }
}

module.exports = TabBar;
