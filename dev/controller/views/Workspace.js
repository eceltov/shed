var React = require('react');

class Workspace extends React.Component {
    render() {
        //var data = this.props.data;

        return (
            <html lang="en">
                <head>
                    <title>Shared Docs</title>
	                <meta charSet="UTF-8" />
                    <script src="https://unpkg.com/babel-standalone@6.26.0/babel.min.js"></script>

                    <script src="https://unpkg.com/react@17/umd/react.development.js"></script>
                    <script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
                    <script src="https://unpkg.com/react-bootstrap@next/dist/react-bootstrap.min.js"></script>

                    <script src="https://unpkg.com/redux/dist/redux.js"></script>
                    <script src="https://unpkg.com/react-redux@5.0.6/dist/react-redux.js"></script>

                    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.1/css/all.css" integrity="sha384-50oBUHEmvpQ+1lW4y57PTFmhCaXp0ML5d60M1M7uH2+nqUivzIebhndOJK28anvf" crossOrigin="anonymous" />
                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css" integrity="sha384-B0vP5xmATw1+K9KRQjQERJvTumQW0nPEzvF6L/Z6nronJ3oUOFUFpCjEUQouq2+l" crossOrigin="anonymous" />

                    <link rel="stylesheet" href="client/default.css" />
                    <script src="editor/ace-builds/src-noconflict/ace.js" type="text/javascript" charSet="utf-8"></script>
                    <script src="lib/dif.js" type="text/javascript"></script>
                    <script src="lib/roles.js" type="text/javascript"></script>
                    <script src="lib/messageTypes.js" type="text/javascript"></script>
                    <script src="client/client.js" type="text/babel"></script>

                </head>
                <body>
                    <div id="reactContainer"></div>
                </body>
            </html>
        );
    }
}

module.exports = Workspace;