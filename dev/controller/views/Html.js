var React = require('react');
var WorkspaceList = require('./WorkspaceList');

class Html extends React.Component {
  render() {
    var data = this.props.data;

    // render the content as a dynamic react component
    // var contentHtml = ReactDOMServer.renderToString(<Content {...data} />);

    return (
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link
            rel="stylesheet"
            href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.1/css/bootstrap.min.css"
          />
        </head>
        <body>
          <WorkspaceList {...data} />
        </body>
      </html>
    );
  }
}
//<script src="/main.js" />

//<div id="content" dangerouslySetInnerHTML={{__html: contentHtml}} />


module.exports = Html;