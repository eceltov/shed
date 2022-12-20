const React = require('react');

/// TODO: remove this
const JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwIiwiZmlyc3ROYW1lIjoiQWRhbSIsImxhc3ROYW1lIjoiVGVzdGVyIiwibWFpbCI6ImFkYW0udGVzdGVyQGV4YW1wbGUuY29tIiwicm9sZSI6InRlc3QiLCJuYmYiOjE2NzA1ODQ2NjgsImV4cCI6MTY3MDU4ODI2OCwiaWF0IjoxNjcwNTg0NjY4fQ.qId4q2xiPxr31Ax1SRRwKUwq4hrFflypU_MSjE5rh44";

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
