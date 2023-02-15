//* Send Http Request
function httpRequest(method, uri, body, errorMsg, callback, logout) {
  const url = uri.includes('http') ? uri : `${uri}`;

  var http = new XMLHttpRequest();
  http.open(method, url, true);
  http.setRequestHeader('Content-type', 'application/json');
  if (logout) {
    http.setRequestHeader('Authorization', 'Basic logout');
  }
  http.addEventListener('readystatechange', processRequest, false);
  http.send(JSON.stringify(body));

  function processRequest() {
    if (http.readyState == 4) {
      try {
        callback(JSON.parse(http.responseText));
      } catch (e) {
        callback(e);
      }
    }
  }
}
