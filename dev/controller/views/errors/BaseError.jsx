const React = require('react');

class BaseError extends React.Component {
  render() {
    return (
      <html lang="en">
        <head>
          <title>{this.props.title}</title>
          <meta charSet="UTF-8" />

          <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.1/css/all.css" integrity="sha384-50oBUHEmvpQ+1lW4y57PTFmhCaXp0ML5d60M1M7uH2+nqUivzIebhndOJK28anvf" crossOrigin="anonymous" />
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css" integrity="sha384-B0vP5xmATw1+K9KRQjQERJvTumQW0nPEzvF6L/Z6nronJ3oUOFUFpCjEUQouq2+l" crossOrigin="anonymous" />
          <link rel="stylesheet" href="styles/default.css" />
        </head>
        <body>
          <div id='htmlErrorPage'>
            <h1>{this.props.heading}</h1>
            <p>{this.props.reason}</p>
          </div>
        </body>
      </html>
    );
  }
}

module.exports = BaseError;
