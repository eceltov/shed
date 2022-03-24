import React from 'react';
import WorkspacesPage from './WorkspacesPage';

export default class Html extends React.Component {
  render() {
    const { workspaces, token } = this.props.data;

    return (
      <html lang="en">
        <head />
        <body>
          <WorkspacesPage workspaces={workspaces} token={token} />
        </body>
      </html>
    );
  }
}
