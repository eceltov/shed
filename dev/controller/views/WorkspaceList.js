const React = require('react');
const roles = require('../../lib/roles');

class WorkspaceList extends React.Component {
  constructor(props) {
    super(props);
    this.createItem = this.createItem.bind(this);
  }

  createItem(workspace, index) {
    return ( 
      <li key={index}>
        <a href={"/workspaces?hash=" + workspace.id}>
          {workspace.name + " (" + roles.getRoleName(workspace.role) + ")"}
        </a>
      </li>
    );
  }

  render() {
    let i = 0;
    return (
    <ul>
      {this.props.workspaces.map((workspace) => this.createItem(workspace, i++))}
    </ul>
    );
  }
}

class WorkspacePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = props;
  }
  render() {
    return (
      <div className="container">
        <h3>Workspaces</h3>
        <WorkspaceList workspaces={this.state.workspaces} />
      </div>
    );
  }
}

module.exports = WorkspacePage;