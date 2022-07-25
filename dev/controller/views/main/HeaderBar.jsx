const React = require('react');

/// TODO: remove this
const JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1MTYyMzkwMjIsImlkIjoiMDAwMDAwMDAiLCJmaXJzdE5hbWUiOiJBZGFtIiwibGFzdE5hbWUiOiJUZXN0ZXIiLCJtYWlsIjoiYWRhbS50ZXN0ZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoidGVzdCJ9.h3DpEIzH9voWwGLTSpMJICornCx0OEIMnvW_zXepW64";

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
                <a href={`/?token=${JWT}`} className="login barLink">
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
