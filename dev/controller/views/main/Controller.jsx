const React = require('react');
const views = require('./viewEnum');
const SelectionBar = require('./SelectionBar');
const AboutPage = require('./AboutPage');
const HeaderBar = require('./HeaderBar');
const WorkspaceList = require('./WorkspaceList');
const CreateWorkspacePage = require('./CreateWorkspacePage');

class Controller extends React.Component {
  // eslint-disable-next-line class-methods-use-this
  renderSelectionBar() {
    return (
      <SelectionBar
        authenticated={this.props.authenticated}
        activeView={this.props.activeView}
      />
    );
  }

  // eslint-disable-next-line class-methods-use-this
  renderHeader() {
    return (
      <HeaderBar authenticated={this.props.authenticated} />
    );
  }

  renderView() {
    switch (this.props.activeView) {
      case views.about:
        return (
          <AboutPage />
        );
      case views.workspaces:
        // workspaces are loaded dynamically
        return (
          <WorkspaceList workspaces={this.props.workspaces} />
        );
      case views.login:
        return (
          <Login />
        );
      case views.createWorkspace:
        return (
          <CreateWorkspacePage />
        );
      default:
        console.error('Error: Bad view in renderView:', this.props.activeView);
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
