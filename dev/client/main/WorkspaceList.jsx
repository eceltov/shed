const React = require('react');
const roles = require('../../lib/roles');

class WorkspaceList extends React.Component {
  constructor(props) {
    super(props);
    this.createItem = this.createItem.bind(this);
  }

  createItem(workspace) {
    return (
      <li key={workspace.id}>
        <a href={`/workspaces?hash=${workspace.id}&token=${this.props.token}`}>
          {`${workspace.name} (${roles.getRoleName(workspace.role)})`}
        </a>
      </li>
    );
  }

  render() {
    return (
      <div className="workspaceList">
        <h3>Workspaces</h3>
        <ul>
          {this.props.workspaces.map((workspace) => this.createItem(workspace))}
        </ul>
      </div>
    );
  }
}

module.exports = WorkspaceList;
