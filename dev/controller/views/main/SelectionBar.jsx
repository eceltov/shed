const React = require('react');
const views = require('./viewEnum');
const selecionBarStates = require('./selectionBarStateEnum');

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
    if (this.props.barState === selecionBarStates.authenticated) {
      return (
        <ul className="selectionBar">
          <li>
            <a href="/" className={this.getLinkStyle(views.homepage)}>{views.homepage}</a>
          </li>
          <li>
            <a href="/workspaces" className={this.getLinkStyle(views.workspaces)}>{views.workspaces}</a>
          </li>
        </ul>
      );
    }
    if (this.props.barState === selecionBarStates.unauthenticated) {
      return (
        <ul className="selectionBar">
          <li>
            <a href="/" className={this.getLinkStyle(views.homepage)}>{views.homepage}</a>
          </li>
          <li>
            <a href="/login" className={this.getLinkStyle(views.login)}>{views.login}</a>
          </li>
        </ul>
      );
    }

    console.error('Error: Unknown bar state in renderLinkList');
    return null;
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
