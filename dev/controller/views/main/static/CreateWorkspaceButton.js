function onCreateWorkspaceButtonClick() {
  const workspaceNameElement = document.getElementById('createWorkspaceName');
  if (workspaceNameElement && workspaceNameElement.value.length > 0) {
    fetch('/api/createWorkspace', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: workspaceNameElement.value }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error !== '') {
          const errorMessage = document.getElementById('errorMessage');
          errorMessage.hidden = false;

          const errorMessageText = document.getElementById('errorMessageText');
          errorMessageText.innerText = `Workspace creation failed with error: ${data.error}.`;
          return;
        }

        window.location.href = '/';
      });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('createWorkspaceButton');
  if (button) {
    button.onclick = onCreateWorkspaceButtonClick;
  }
});
