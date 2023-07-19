const React = require('react');
const roles = require('../../lib/roles');

class WorkspaceList extends React.Component {
  constructor(props) {
    super(props);
    this.createItem = this.createItem.bind(this);
  }

  // eslint-disable-next-line class-methods-use-this
  createItem(workspace) {
    if (workspace.role === roles.roles.none)
      return;
      
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
        <div className="workspacesTitle">
          <div className="workspacesTitleText">
            Workspaces
          </div>
          <button className="newButton" type="submit" id="newWorkspaceButton">
            New
          </button>
        </div>

        <ul className="workspaceList">
          {this.props.workspaces.map((workspace) => this.createItem(workspace))}
        </ul>
      </div>
    );
  }
}

module.exports = WorkspaceList;
