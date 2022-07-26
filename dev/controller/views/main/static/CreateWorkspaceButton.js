function onCreateWorkspaceButtonClick() {
  const workspaceNameElement = document.getElementById('createWorkspaceName');
  if (workspaceNameElement && workspaceNameElement.value.length > 0) {
    const button = document.getElementById('createWorkspaceButton');
    button.textContent = 'Creating...';
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
  const button = document.getElementById('createWorkspaceButton');
  if (button) {
    button.onclick = onCreateWorkspaceButtonClick;
  }
});
