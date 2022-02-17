const SERVER_URL = 'ws://localhost:8080/';
const CSLatency = 0;
const SCLatency = 0;
const modelist = ace.require('ace/ext/modelist');
const Range = ace.require('ace/range').Range;
const EditSession = ace.require('ace/edit_session').EditSession;
const Document = ace.require('ace/document').Document;
function log(content) {
  console.log(JSON.parse(JSON.stringify(content)));
}

ReactDOM.render(
  <Workspace />, document.getElementById('reactContainer'),
);
