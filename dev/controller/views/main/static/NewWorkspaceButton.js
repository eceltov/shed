function onNewWorkspaceButtonClick() {
  console.log('cliek');
  window.location.href = '/create';
}

window.addEventListener('DOMContentLoaded', () => {
  console.log('b');
  const button = document.getElementById('newWorkspaceButton');
  if (button) {
    button.onclick = onNewWorkspaceButtonClick;
  }
});
