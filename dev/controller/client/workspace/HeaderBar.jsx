const React = require('react');
const roles = require('../../lib/roles');

class HeaderBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.handleOptionsClick = this.handleOptionsClick.bind(this);
  }

  handleOptionsClick() {
    this.props.showOptionsView();
  }

  renderOptions() {
    // do not render the options button if the options screen would be empty
    if (!roles.canAddUsers(this.props.role) && !roles.canChangeWorkspaceAccessType(this.props.role))
      return null;

    return (
      <div role="button" tabIndex={0} className="options barLink" onClick={this.handleOptionsClick}>
        Options
      </div>
    );
  }

  renderLogIn() {
    if (!this.props.loggedIn) {
      return (
        <a href="/login" className="login barLink">
          Log In
        </a>
      );
    }

    return (
      <a href="/logout" className="login barLink">
        Log Out
      </a>
    );
  }

  render() {
    return (
      <div className="headerBar">
        <a href="/" className="logo">
          ShEd
        </a>
        <div className="right">
          {this.renderOptions()}
          {this.renderLogIn()}
        </div>
      </div>
    );
  }
}

module.exports = HeaderBar;
