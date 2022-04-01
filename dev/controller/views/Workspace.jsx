const React = require('react');

class Workspace extends React.Component {
  render() {
    // var data = this.props.data;

    return (
      <html lang="en">
        <head>
          <title>Shared Docs</title>
          <meta charSet="UTF-8" />

          <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.1/css/all.css" integrity="sha384-50oBUHEmvpQ+1lW4y57PTFmhCaXp0ML5d60M1M7uH2+nqUivzIebhndOJK28anvf" crossOrigin="anonymous" />
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css" integrity="sha384-B0vP5xmATw1+K9KRQjQERJvTumQW0nPEzvF6L/Z6nronJ3oUOFUFpCjEUQouq2+l" crossOrigin="anonymous" />
          <link rel="stylesheet" href="client/default.css" />

          <script src="editor/ace-builds/src-noconflict/ace.js" type="text/javascript" charSet="utf-8" />
          <script src="editor/ace-builds/src-noconflict/ext-modelist.js" type="text/javascript" charSet="utf-8" />
          <script src="client/bundle.js" type="text/javascript" />
        </head>
        <body>
          <div id="reactContainer" />
        </body>
      </html>
    );
  }
}

module.exports = Workspace;
