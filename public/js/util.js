async function httpRequest(method, uri, body, errorMsg, callback, logout) {
  const headers = { 'Content-type': 'application/json' };
  if (logout) {
    headers['Authorization'] = 'Basic logout';
  }

  try {
    const res = await fetch(uri, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    callback(data);
  } catch (e) {
    callback(e);
  }
}
