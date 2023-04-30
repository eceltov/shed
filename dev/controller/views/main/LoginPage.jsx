/* eslint-disable jsx-a11y/label-has-associated-control */
const React = require('react');

class LoginPage extends React.Component {
  render() {
    return (
      <div className="content">
        <h1 className="title">Log In</h1>

        <div className="createSegment">
          <label className="createName">
            Username
            <input type="text" className="credentialsInput" name="label" id="usernameInput" required />
          </label>
        </div>

        <div className="createSegment">
          <label className="createName">
            Password
            <input type="password" className="credentialsInput" name="label" id="passwordInput" required />
          </label>
        </div>

        <div className="createSegment">
          <button className="loginButton" type="submit" id="loginButton">
            Log In
          </button>
        </div>
      </div>
    );
  }
}

module.exports = LoginPage;
