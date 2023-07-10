const React = require('react');
const views = require('./viewEnum');

class SelectionBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  getLinkStyle(view) {
    if (view === this.props.activeView) {
      return 'barLink bold';
    }
    return 'barLink';
  }

  renderLinkList() {
    if (this.props.authenticated) {
      return (
        <ul className="selectionBar">
          <li>
            <a href="/" className={this.getLinkStyle(views.workspaces)}>{views.workspaces}</a>
          </li>
          <li>
            <a href="/create" className={this.getLinkStyle(views.createWorkspace)}>{views.createWorkspace}</a>
          </li>
        </ul>
      );
    }

    return (
      <ul className="selectionBar">
      </ul>
    );
  }

  render() {
    return (
      <div id="leftBar">
        {this.renderLinkList()}
      </div>
    );
  }
}

module.exports = SelectionBar;
