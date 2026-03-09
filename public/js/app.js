window.onload = () => {
  setBodyPath();
  addFileClickHandler();
};

function setBodyPath() {
  const pathName = location.pathname;
  const pathTag = document.getElementById('current-location');
  if (pathTag) {
    pathTag.innerText = decodeURIComponent(pathName);
  }
}

function addFileClickHandler() {
  const pathName = location.pathname;
  const files = document.getElementsByClassName('file-name');
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    file.addEventListener('click', function () {
      const fileName = file.innerText;
      let uri =
        pathName !== '/'
          ? location.origin + pathName + '/' + fileName
          : location.origin + '/' + fileName;

      if (fileName === '..') {
        const paths = pathName.split('/');
        uri = location.origin;
        if (paths.length === 2) {
          location.href = location.origin;
          return;
        }
        for (let j = 1; j < paths.length - 1; j++) {
          uri += '/' + paths[j];
        }
      }

      if (uri.endsWith('/')) {
        uri = uri.slice(0, -1);
      }
      location.href = uri;
    });
  }
}

function updateUploadLabel(input) {
  const label = document.getElementById('upload-label');
  if (!label) return;
  if (input.files.length === 0) {
    label.textContent = 'Choose files to upload...';
  } else if (input.files.length === 1) {
    label.textContent = input.files[0].name;
  } else {
    label.textContent = `${input.files.length} files selected`;
  }
}

function uploadFiles() {
  const input = document.getElementById('upload-input');
  const status = document.getElementById('upload-status');
  const progressBar = document.getElementById('upload-progress-bar');
  const progressWrap = document.getElementById('upload-progress-wrap');

  if (!input.files.length) {
    alert('업로드할 파일을 선택해주세요.');
    return;
  }

  const files = Array.from(input.files);
  const total = files.length;
  let completed = 0;
  let totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  let uploadedBytes = 0;

  progressWrap.classList.remove('hidden');
  progressBar.style.width = '0%';
  status.textContent = `Uploading... (0/${total})`;

  function uploadNext(index) {
    if (index >= total) return;

    const file = files[index];
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', location.pathname);

    xhr.upload.addEventListener('progress', (e) => {
      if (!e.lengthComputable) return;
      const percent = Math.round(((uploadedBytes + e.loaded) / totalBytes) * 100);
      progressBar.style.width = `${percent}%`;
    });

    xhr.addEventListener('load', () => {
      uploadedBytes += file.size;
      completed++;
      progressBar.style.width = `${Math.round((uploadedBytes / totalBytes) * 100)}%`;
      status.textContent = `Uploading... (${completed}/${total})`;

      if (completed === total) {
        status.textContent = 'Upload complete!';
        setTimeout(() => location.reload(), 800);
      } else {
        uploadNext(index + 1);
      }
    });

    xhr.addEventListener('error', () => {
      status.textContent = 'Upload failed';
      alert(`"${file.name}" 업로드에 실패했습니다.`);
    });

    xhr.send(formData);
  }

  uploadNext(0);
}

function mkdir() {
  const input = document.getElementById('mkdir-input');
  const name = input.value.trim();
  if (!name) {
    alert('폴더 이름을 입력해주세요.');
    return;
  }

  const path = location.pathname === '/' ? `/${name}` : `${location.pathname}/${name}`;

  fetch(path, { method: 'PUT' })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        location.reload();
      } else {
        alert(data.message ?? '폴더 생성에 실패했습니다.');
      }
    })
    .catch(() => alert('폴더 생성에 실패했습니다.'));
}

function rmdir(name) {
  if (!confirm(`"${name}" 폴더를 삭제하시겠습니까?`)) return;

  const path = location.pathname === '/' ? `/${name}` : `${location.pathname}/${name}`;

  fetch(path, { method: 'DELETE' })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        location.reload();
      } else {
        alert(data.message ?? '폴더 삭제에 실패했습니다.');
      }
    })
    .catch(() => alert('폴더 삭제에 실패했습니다.'));
}

function goLogin() {
  const loginForm = document.getElementById('user-login');
  if (!loginForm) return;

  const idValue = loginForm.querySelector('input#id-value').value;
  const hash = sha256(loginForm.querySelector('input#pw-value').value);

  httpRequest(
    'POST',
    '/users/login',
    { username: idValue, password: hash },
    'Fail to login',
    function (result) {
      if (result.success) {
        location.href = '/';
        return;
      }
      alert(result.message);
    },
  );
}

function logout() {
  httpRequest('POST', '/users/logout', {}, 'Fail to logout', function () {
    location.reload();
  });
}
