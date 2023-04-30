function onLoginButtonClick() {
  const username = document.getElementById('usernameInput').value;
  const password = document.getElementById('passwordInput').value;

  fetch('/api/login', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })
  .then((res) => res.json())
  .then((data) => window.location.href = `/?token=${data.token}`);
}

window.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('loginButton');
  if (button) {
    button.onclick = onLoginButtonClick;
  }
});
