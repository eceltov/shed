function onNewWorkspaceButtonClick() {
  window.location.href = '/create';
}

window.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('newWorkspaceButton');
  if (button) {
    button.onclick = onNewWorkspaceButtonClick;
  }
});
