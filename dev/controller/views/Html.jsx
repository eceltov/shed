const React = require('react');
const WorkspacesPage = require('./WorkspacesPage');

class Html extends React.Component {
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

module.exports = Html;
