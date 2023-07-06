function getUsernameInput() {
  return document.getElementById('usernameInput');
}

function getPasswordInput() {
  return document.getElementById('passwordInput')
}

function onLoginButtonClick() {
  const username = getUsernameInput().value;
  const password = getPasswordInput().value;

  fetch('/api/login', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })
  .then((res) => res.json())
  .then((data) => {
    console.log(data);
    if (data.token == undefined || data.token == null) {
      const errorMessage = document.getElementById("errorMessage");
      errorMessage.hidden = false;
      return;
    }

    window.location.href = `/?token=${data.token}`;
  });
}

function bindOnEnterSubmit(inputElement, button) {
  if (!inputElement)
    return;
  inputElement.addEventListener("keypress", function(event) {
    // click on enter when both inputs are not empty
    if (event.key === "Enter" && getUsernameInput().value !== "" && getPasswordInput().value !== "") {
      event.preventDefault();
      button.click();
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('loginButton');
  if (button) {
    button.onclick = onLoginButtonClick;
  }

  // so that pressing enter submits 
  const usernameInput = getUsernameInput();
  const passwordInput = getPasswordInput();
  bindOnEnterSubmit(usernameInput, button);
  bindOnEnterSubmit(passwordInput, button);
});
