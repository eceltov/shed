const React = require('react');
const views = require('./viewEnum');
const SelectionBar = require('./SelectionBar');
const Login = require('./Login');
const Homepage = require('./Homepage');
const selecionBarStates = require('./selectionBarStateEnum');

class Controller extends React.Component {
  // eslint-disable-next-line class-methods-use-this
  renderSelectionBar() {
    return (
      <SelectionBar barState={selecionBarStates.authenticated} />
    );
  }

  // eslint-disable-next-line class-methods-use-this
  renderHeader() {
    return (
      <div className="headerBar" />
    );
  }

  renderView() {
    switch (this.props.view) {
      case views.homepage:
        return (
          <Homepage />
        );
      case views.workspaces:
        // workspaces are loaded dynamically
        return (
          <div id="reactContainer" />
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
      <div className="main">
        { this.renderHeader() }
        { this.renderSelectionBar() }
        { this.renderView() }
      </div>
    );
  }
}

module.exports = Controller;
