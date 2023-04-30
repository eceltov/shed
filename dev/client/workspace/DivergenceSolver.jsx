const React = require('react');

class DivergenceSolver extends React.Component {
  constructor(props) {
    super(props);
    this.handleOnClick = this.handleOnClick.bind(this);
    this.state = {
      clicked: false,
    };
  }

  handleOnClick(e) {
    this.props.func();
    this.setState({
      clicked: true,
    });
  }

  render() {
    if (this.props.userCanEdit) {
      return (
        <div className="divergenceSolver">
          <p>
            Document divergence detected.
            If you wish, you can force your document version on all clients.
            Otherwise wait for a different client to force its document.
          </p>
          {
            this.state.clicked ?
            <p className="divergenceSolverConfirmation">
              Document sent to server.
            </p>
            :
            <div role="button" className="divergenceButton" onClick={this.handleOnClick}>
              Force Document State
            </div>
          }
        </div>
      );
    }
    else {
      return (
        <div className="divergenceSolver">
          <p>
            Document divergence detected.
            Wait for a priviledged user to force their document.
          </p>
        </div>
      );
    }
  }
}

module.exports = DivergenceSolver;
