function showAddUserDialog() {
  const target = document.getElementById('user-add-popup');
  if (!target) {
    return;
  }

  target.style.display = 'block';
}

function closeAddUserDialog() {
  const target = document.getElementById('user-add-popup');
  if (!target) {
    return;
  }

  document.getElementById('id-value').value = '';
  document.getElementById('pw-value').value = '';
  target.style.display = 'none';
}

function logoutAdminPage() {
  //   const p = window.location.protocol + '//';
  //   window.location = window.location.href.replace(p, p + 'log:out@');
  httpRequest(
    'GET',
    '/admin',
    null,
    'Fail to logout',
    cb_logoutAdminPage,
    true,
  );
}

function cb_logoutAdminPage(result) {}

function registerUser() {
  const modal = document.getElementById('user-add-popup');
  if (!modal) {
    return;
  }
  const userId = document.getElementById('id-value').value;
  const userPw = sha256(document.getElementById('pw-value').value);

  httpRequest(
    'POST',
    '/users/signup',
    {
      username: userId,
      password: userPw,
    },
    'Fail to sign up the user',
    cb_registerUser,
  );
}
function cb_registerUser(result) {
  if (result.success) {
    document.getElementById('id-value').value = '';
    document.getElementById('pw-value').value = '';
    closeAddUserDialog();

    location.reload();
  }
}

function removeUser(parent) {
  const userId = parent.dataset.user;
  httpRequest(
    'DELETE',
    '/users',
    { username: userId },
    'Fail to remove user',
    (result) => {
      cb_removeUser(result, parent);
    },
  );
}

function cb_removeUser(result, parent) {
  if (!result.success) {
    alert(result.message);
    return;
  }

  parent.remove();
}
