function onDeleteWorkspaceButtonClick(e) {
  const workspaceHash = e.target.id;
  const workspaceName = e.target.getAttribute('workspacename');
  if (window.confirm(`Do you really want to delete '${workspaceName}'?`)) {
    fetch(window.location.href + 'api/deleteWorkspace', {
      method: 'POST',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ "workspaceHash": workspaceHash })
    });
    location.reload();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const buttons = document.getElementsByName('deleteWorkspaceButton');
  for (button of buttons) {
    button.onclick = onDeleteWorkspaceButtonClick;
  }
});
