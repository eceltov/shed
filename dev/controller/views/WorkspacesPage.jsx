import React from 'react';
import WorkspaceList from './WorkspaceList';

export default class WorkspacesPage extends React.Component {
  render() {
    return (
      <div className="container">
        <h3>Workspaces</h3>
        <WorkspaceList workspaces={this.props.workspaces} token={this.props.token} />
      </div>
    );
  }
}
