/* eslint-disable jsx-a11y/label-has-associated-control */
const React = require('react');

class CreateWorkspacePage extends React.Component {
  render() {
    return (
      <div className="content">
        <h1 className="title">Create New Workspace</h1>

        <div className="createSegment">
          <label className="createName">
            Workspace Name
            <input type="text" className="createInput" name="label" id="createWorkspaceName" placeholder="My Workspace" required />
          </label>
        </div>

        <div hidden className="createSegment" id="errorMessage">
          <label id="errorMessageText" className="createName logInError" />
        </div>

        <div className="createSegment">
          <button className="createWorkspaceButton" type="submit" id="createWorkspaceButton">
            Create
          </button>
        </div>
      </div>
    );
  }
}

module.exports = CreateWorkspacePage;
