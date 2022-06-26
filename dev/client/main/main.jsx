const React = require('react');
const ReactDOM = require('react-dom');
const Controller = require('./Controller');

window.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(
    <Controller />, document.getElementById('reactContainer'),
  );
});
