const React = require('react');

class HeaderBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div className="headerBar">
        <a href="/" className="logo">
          ShEd
        </a>
        <a href="/logout" className="login barLink">
          Log Out
        </a>
      </div>
    );
  }
}

module.exports = HeaderBar;
