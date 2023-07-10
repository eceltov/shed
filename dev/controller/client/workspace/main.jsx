const React = require('react');
const ReactDOM = require('react-dom');
const Workspace = require('./Workspace');

window.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(
    <Workspace />, document.getElementById('reactContainer'),
  );
});
