const React = require('react');

class WaitingForInit extends React.Component {
  constructor(props) {
    super(props);
    this.timeTick = this.timeTick.bind(this);
    this.state = {
      secondsWaited: 0,
    };
  }

  timeTick() {
    this.setState((prevState) => ({
      secondsWaited: prevState.secondsWaited + 1,
    }));
  }

  componentDidMount() {
    this.interval = setInterval(this.timeTick, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return (
      <div className="waitingMessage">
          Waiting on server{this.state.secondsWaited === 0 ? null : ` (${this.state.secondsWaited} s)`}...
      </div>
    );
  }
}

module.exports = WaitingForInit;
