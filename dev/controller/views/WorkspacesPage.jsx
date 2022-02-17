const React = require('react');
const WorkspaceList = require('./WorkspaceList');

class WorkspacesPage extends React.Component {
  render() {
    return (
      <div className="container">
        <h3>Workspaces</h3>
        <WorkspaceList workspaces={this.props.workspaces} token={this.props.token} />
      </div>
    );
  }
}

module.exports = WorkspacesPage;
