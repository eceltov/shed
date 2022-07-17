const React = require('react');
const roles = require('../../../lib/roles');

class WorkspaceList extends React.Component {
  constructor(props) {
    super(props);
    this.createItem = this.createItem.bind(this);
  }

  // eslint-disable-next-line class-methods-use-this
  createItem(workspace) {
    return (
      <li key={workspace.id} className="workspaceLinkContainer">
        <a href={`/workspace?hash=${workspace.id}`} className="workspaceLink">
          {`${workspace.name} (${roles.getRoleName(workspace.role)})`}
        </a>
      </li>
    );
  }

  render() {
    return (
      <div className="content">
        <h1 className="title">Workspaces</h1>
        <ul className="workspaceList">
          {this.props.workspaces.map((workspace) => this.createItem(workspace))}
        </ul>
      </div>
    );
  }
}

module.exports = WorkspaceList;
