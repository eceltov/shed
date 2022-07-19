function onCreateWorkspaceButtonClick() {
  const workspaceNameElement = document.getElementById('createWorkspaceName');
  if (workspaceNameElement) {
    fetch('/api/createWorkspace', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: workspaceNameElement.value }),
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  console.log('a');
  const button = document.getElementById('createWorkspaceButton');
  if (button) {
    button.onclick = onCreateWorkspaceButtonClick;
  }
});
