const React = require('react');
const roles = require('../../lib/roles');
const workspaceAccessTypes = require('../../lib/workspaceAccessTypes');

class OptionsScreen extends React.Component {
  constructor(props) {
    super(props);
    this.handleAddUser = this.handleAddUser.bind(this);
    this.onAccessTypeChange = this.onAccessTypeChange.bind(this);
  }

  validateUsername(username) {
    return typeof username === 'string'
      && /^[a-zA-Z0-9]+$/.test(username);
  }

  handleAddUser(e) {
    const usernameInput = document.getElementById('usernameInput');
    const roleInput = document.getElementById('roleInput');
    const username = usernameInput.value;
    const role = roleInput.value;

    if (this.validateUsername(username)
      && role > roles.roles.none
      && role < roles.roles.owner
    ) {
      this.props.addUserToWorkspace(username, role);
      usernameInput.value = "";
      return;
    }

    console.log(`Error in handleAddUser: Invalid values: ${username}, ${role}`);
  }

  onAccessTypeChange(e) {
    this.props.changeWorkspaceAccessType(e.target.value);
  }

  renderAddUsers() {
    return (
      <div>
        <h1 className="optionsTitle">Add Users To Workspace</h1>

        <div className="createSegment">
          <label className="createName">
            Username
            <input type="text" className="credentialsInput" name="label" id="usernameInput" required />
          </label>
        </div>

        <div className="createSegment">
          <label className="createName">
            Role
            <select className="credentialsInput" name="label" id="roleInput" required>
              <option value={roles.roles.viewer}>{roles.getRoleName(roles.roles.viewer)}</option>
              <option value={roles.roles.editor}>{roles.getRoleName(roles.roles.editor)}</option>
              <option value={roles.roles.workspaceEditor}>{roles.getRoleName(roles.roles.workspaceEditor)}</option>
              <option value={roles.roles.admin}>{roles.getRoleName(roles.roles.admin)}</option>
            </select>
          </label>
        </div>

        <div className="createSegment">
          <button className="loginButton" type="submit" id="addUserButton" onClick={this.handleAddUser}>
            Add
          </button>
        </div>
      </div>
    );
  }

  renderChangeAccessTypes() {
    return (
      <div>
        <h1 className="optionsTitle">Change Workspace Access Type</h1>

        <div className="createSegment">
          <label className="createName">
            Access Type
            <select className="credentialsInput" name="label" id="accessInput" required
              onChange={this.onAccessTypeChange}
              defaultValue={this.props.accessType}
            >
              <option value={workspaceAccessTypes.accessTypes.priviledged}>Priviledged</option>
              <option value={workspaceAccessTypes.accessTypes.allReadOnly}>All (Read Only)</option>
            </select>
          </label>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="optionsContent">
        {!roles.canAddUsers(this.props.role) ? null :
          this.renderAddUsers()
        }

        {!roles.canChangeWorkspaceAccessType(this.props.role) ? null :
          this.renderChangeAccessTypes()
        }
      </div>
    );
  }
}

module.exports = OptionsScreen;
