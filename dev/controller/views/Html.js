var React = require('react');
var WorkspaceList = require('./WorkspaceList');

class Html extends React.Component {
  render() {
    var data = this.props.data;

    return (
      <html lang="en">
        <head>
        </head>
        <body>
          <WorkspaceList {...data} />
        </body>
      </html>
    );
  }
}

module.exports = Html;
