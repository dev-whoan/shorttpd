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
