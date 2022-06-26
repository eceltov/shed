const React = require('react');
const views = require('./viewEnum');
const SelectionBar = require('./SelectionBar');
const Login = require('./Login');
const Homepage = require('./Homepage');
const WorkspaceList = require('./WorkspaceList');

class Controller extends React.Component {
  constructor(props) {
    super(props);
    this.setView = this.setView.bind(this);

    this.state = {
      view: views.workspaces,
    };
  }

  setView(view) {
    this.setState((prevState) => ({
      view,
    }));
  }

  renderSelectionBar() {
    return (
      <SelectionBar setView={this.setView} />
    );
  }

  // eslint-disable-next-line class-methods-use-this
  renderHeader() {
    return (
      <div />
    );
  }

  renderView() {
    switch (this.state.view) {
      case views.homepage:
        return (
          <Homepage />
        );
      case views.workspaces:
        return (
          <WorkspaceList workspaces={this.props.data.workspaces} token={this.props.data.token} />
        );
      case views.login:
        return (
          <Login />
        );
      default:
        console.error('Error: Bad view in renderView');
        return (
          <div />
        );
    }
  }

  render() {
    return (
      <div>
        { this.renderHeader() }
        { this.renderSelectionBar() }
        { this.renderView() }
      </div>
    );
  }
}

module.exports = Controller;
