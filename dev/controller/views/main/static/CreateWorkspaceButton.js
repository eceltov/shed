function onCreateWorkspaceButtonClick() {
  const workspaceNameElement = document.getElementById('createWorkspaceName');
  if (workspaceNameElement && workspaceNameElement.value.length > 0) {
    fetch('/api/createWorkspace', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: workspaceNameElement.value }),
    });
    window.location.href = '/';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('createWorkspaceButton');
  if (button) {
    button.onclick = onCreateWorkspaceButtonClick;
  }
});
