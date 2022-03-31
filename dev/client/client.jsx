const React = require('react');
const ReactDOM = require('react-dom');
const fsOps = require('../lib/fileStructureOps');
const ManagedSession = require('../lib/ManagedSession');
const msgFactory = require('../lib/clientMessageFactory');
const msgTypes = require('../lib/messageTypes');
const roles = require('../lib/roles');
const utils = require('../lib/utils');
const Workspace = require('./Workspace.jsx');

window.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(
    <Workspace />, document.getElementById('reactContainer'),
  );
});
