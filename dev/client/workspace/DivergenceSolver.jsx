const React = require('react');

class DivergenceSolver extends React.Component {
  constructor(props) {
    super(props);
    this.handleOnClick = this.handleOnClick.bind(this);
  }

  handleOnClick(e) {
    this.props.func();
  }

  render() {
    return (
      <div className="divergenceSolver">
        <p>
          Document divergence detected.
          If you wish, you can force your document version on all clients.
        </p>
        <div role="button" className="divergenceButton" onClick={this.handleOnClick}>
          Force Document State
        </div>
      </div>
      
    );
  }
}

module.exports = DivergenceSolver;
