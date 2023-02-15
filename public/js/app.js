window.onload = () => {
  setBodyPath();
  addFileClickHandler();
};
function setBodyPath() {
  const pathName = location.pathname;
  const pathTag = document.getElementById('current-location');

  let decoded = decodeURI(pathName);
  // 디코딩 후, 기존과 다르면 encode 된 것임
  if (decoded === pathName) {
    decoded = pathName;
  }

  if (pathTag) {
    pathTag.innerText = decoded;
  }
}
function addFileClickHandler() {
  const pathName = location.pathname;
  const files = document.getElementsByClassName('file-name');
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    file.addEventListener('click', function (e) {
      const fileName = file.innerText;
      const isDir = file.dataset.isdir;
      let uri =
        pathName !== '/'
          ? location.origin + pathName + '/' + fileName
          : location.origin + '/' + fileName;

      if (fileName === '..') {
        let paths = pathName.split('/');
        uri = location.origin;
        if (paths.length === 2) {
          location.href = location.origin;
          return;
        }

        for (let i = 1; i < paths.length - 1; i++) {
          uri += '/' + paths[i];
        }
      }
      if (uri.substring(uri.length - 1) === '/') {
        uri = uri.substring(0, uri.length - 1);
      }
      location.href = uri;
    });
  }
}

function goLogin() {
  const loginForm = document.getElementById('user-login');
  if (!loginForm) {
    return;
  }

  const idValue = loginForm.querySelector('input#id-value').value;
  const hash = sha256(loginForm.querySelector('input#pw-value').value);

  httpRequest(
    'POST',
    '/users/login',
    {
      username: idValue,
      password: hash,
    },
    'Fail to login',
    function (result) {
      console.log(result);
      if (result.success) {
        location.href = '/';
        return;
      }

      alert(result.message);
    },
  );
}

function logout() {
  httpRequest('POST', '/users/logout', {}, 'Fail to logout', function (result) {
    location.reload();
  });
}
