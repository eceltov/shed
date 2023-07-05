const React = require('react');

class HeaderBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.handleOptionsClick = this.handleOptionsClick.bind(this);
  }

  handleOptionsClick() {
    this.props.showOptionsView();
  }

  render() {
    return (
      <div className="headerBar">
        <a href="/" className="logo">
          ShEd
        </a>
        <div className="right">
          <div role="button" tabIndex={0} className="options barLink" onClick={this.handleOptionsClick}>
            Options
          </div>
          <a href="/logout" className="login barLink">
            Log Out
          </a>
        </div>
      </div>
    );
  }
}

module.exports = HeaderBar;
