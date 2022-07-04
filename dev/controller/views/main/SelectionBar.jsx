const React = require('react');
const views = require('./viewEnum');
const selecionBarStates = require('./selectionBarStateEnum');

class SelectionBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  renderLinkList() {
    if (this.props.barState === selecionBarStates.authenticated) {
      return (
        <ul>
          <li>
            <a href="/" className="barLink">{views.homepage}</a>
          </li>
          <li>
            <a href="/workspaces" className="barLink">{views.workspaces}</a>
          </li>
        </ul>
      );
    }
    if (this.props.barState === selecionBarStates.unauthenticated) {
      return (
        <ul>
          <li>
            <a href="/" className="barLink">{views.homepage}</a>
          </li>
          <li>
            <a href="/login" className="barLink">{views.login}</a>
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
