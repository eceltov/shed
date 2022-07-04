const React = require('react');
const axios = require('axios');
const roles = require('../../lib/roles');

/// TODO: this should be loaded from cookies
/// TODO: remove this, this is only for testing
const AUTH_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwIiwiaWF0IjoxNTE2MjM5MDIyfQ.wJhMmoToYV7W3_fGqeZy4D9U7NaFInJq615vm_URsgU';
axios.defaults.headers.common.Authorization = AUTH_TOKEN;
axios.defaults.baseURL = 'http://localhost:8060';
const USER = '00000000';

class WorkspaceList extends React.Component {
  constructor(props) {
    super(props);
    this.createItem = this.createItem.bind(this);

    this.state = {
      workspaces: [],
    };
  }

  // eslint-disable-next-line class-methods-use-this
  getWorkspaces() {
    return axios.get('/workspaceList')
      .then((response) => {
        // handle success
        console.log(response.data);
        return response.data;
      })
      .catch((error) => {
        // handle error
        console.log(error);
        return [];
      });
  }

  // eslint-disable-next-line class-methods-use-this
  createItem(workspace) {
    return (
      <li key={workspace.id} className="barLink">
        <a href={`/workspace?hash=${workspace.id}&token=${USER}`}>
          {`${workspace.name} (${roles.getRoleName(workspace.role)})`}
        </a>
      </li>
    );
  }

  componentDidMount() {
    console.log('mounted');
    this.getWorkspaces()
      .then((workspaces) => {
        console.log('got workspaces:', workspaces);
        this.setState((prevState) => ({
          workspaces,
        }));
      });
  }

  render() {
    return (
      <div className="content">
        <h3>Workspaces</h3>
        <ul>
          {this.state.workspaces.map((workspace) => this.createItem(workspace))}
        </ul>
      </div>
    );
  }
}

module.exports = WorkspaceList;
