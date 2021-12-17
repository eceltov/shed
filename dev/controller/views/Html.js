var React = require('react');
var WorkspacesPage = require('./WorkspacesPage');

class Html extends React.Component {
  render() {
    var data = this.props.data;

    return (
      <html lang="en">
        <head>
        </head>
        <body>
          <WorkspacesPage {...data} />
        </body>
      </html>
    );
  }
}

module.exports = Html;
