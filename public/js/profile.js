function changePassword() {
  const currentPw = document.getElementById('current-pw').value;
  const newPw = document.getElementById('new-pw').value;
  const confirmPw = document.getElementById('confirm-pw').value;
  const status = document.getElementById('pw-change-status');

  if (newPw !== confirmPw) {
    status.textContent = '새 비밀번호가 일치하지 않습니다.';
    status.className = 'text-sm text-red-500';
    return;
  }

  httpRequest(
    'PATCH',
    '/users/password',
    { currentPassword: sha256(currentPw), newPassword: sha256(newPw) },
    'Fail to change password',
    (result) => {
      if (result.success) {
        status.textContent = '비밀번호가 변경되었습니다.';
        status.className = 'text-sm text-green-600';
        document.getElementById('current-pw').value = '';
        document.getElementById('new-pw').value = '';
        document.getElementById('confirm-pw').value = '';
      } else {
        status.textContent = result.message ?? '비밀번호 변경에 실패했습니다.';
        status.className = 'text-sm text-red-500';
      }
    },
  );
}

function logout() {
  httpRequest('POST', '/users/logout', {}, 'Fail to logout', function () {
    location.href = '/users/login';
  });
}
