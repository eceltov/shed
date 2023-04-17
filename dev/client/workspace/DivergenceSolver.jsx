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
}

module.exports = DivergenceSolver;
