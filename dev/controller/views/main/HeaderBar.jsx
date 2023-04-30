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
        <div className="right">
          {
            this.props.authenticated
              ? (
                <a href="/logout" className="login barLink">
                  Log Out
                </a>
              )
              : (
                <a href={'/login'} className="login barLink">
                  Log In
                </a>
              )
          }
        </div>
      </div>
    );
  }
}

module.exports = HeaderBar;
