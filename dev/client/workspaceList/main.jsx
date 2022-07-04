const React = require('react');
const ReactDOM = require('react-dom');
const WorkspaceList = require('./WorkspaceList');

window.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(
    <WorkspaceList />, document.getElementById('reactContainer'),
  );
});
