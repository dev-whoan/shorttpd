function showAddUserDialog() {
  const target = document.getElementById('user-add-popup');
  if (!target) return;
  target.classList.remove('hidden');
}

function closeAddUserDialog() {
  const target = document.getElementById('user-add-popup');
  if (!target) return;

  document.getElementById('id-value').value = '';
  document.getElementById('pw-value').value = '';
  document.getElementById('perm-list').innerHTML = '';
  target.classList.add('hidden');
}

function showEditUserDialog(username, permissionJson) {
  const target = document.getElementById('user-edit-popup');
  if (!target) return;

  document.getElementById('edit-username').value = username;
  document.getElementById('edit-username-label').textContent = username;
  document.getElementById('edit-pw-value').value = '';
  document.getElementById('edit-perm-list').innerHTML = '';

  try {
    const permissions = JSON.parse(permissionJson || '[]');
    permissions.forEach((p) => addPermissionRow(p.path, p.access, 'edit-perm-list'));
  } catch {}

  target.classList.remove('hidden');
}

function closeEditUserDialog() {
  const target = document.getElementById('user-edit-popup');
  if (!target) return;
  target.classList.add('hidden');
}

function addPermissionRow(path, access, listId = 'perm-list') {
  const list = document.getElementById(listId);
  const row = document.createElement('div');
  row.className = 'flex gap-2 items-center';

  const pathInput = document.createElement('input');
  pathInput.type = 'text';
  pathInput.placeholder = '/path or *';
  pathInput.className = 'perm-path flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 font-mono';
  pathInput.value = path || '';

  const accessSelect = document.createElement('select');
  accessSelect.className = 'perm-access text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-900';
  ['r', 'rw', 'rwd'].forEach((val) => {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = val;
    if (access === val) opt.selected = true;
    accessSelect.appendChild(opt);
  });

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.textContent = '×';
  removeBtn.className = 'w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors text-lg leading-none';
  removeBtn.onclick = () => row.remove();

  row.appendChild(pathInput);
  row.appendChild(accessSelect);
  row.appendChild(removeBtn);
  list.appendChild(row);
}

function collectPermissions(listId = 'perm-list') {
  const rows = document.querySelectorAll(`#${listId} > div`);
  const result = [];
  rows.forEach((row) => {
    const path = row.querySelector('.perm-path').value.trim();
    const access = row.querySelector('.perm-access').value;
    if (path) {
      result.push({ path, access });
    }
  });
  return result;
}

function logoutAdminPage() {
  location.href = ADMIN_PREFIX + '/logout';
}

function registerUser() {
  const modal = document.getElementById('user-add-popup');
  if (!modal) return;

  const userId = document.getElementById('id-value').value;
  const userPw = sha256(document.getElementById('pw-value').value);
  const permissions = collectPermissions('perm-list');

  httpRequest(
    'POST',
    '/users/signup',
    { username: userId, password: userPw, permissions },
    'Fail to sign up the user',
    cb_registerUser,
  );
}

function cb_registerUser(result) {
  if (result.success) {
    closeAddUserDialog();
    location.reload();
  } else {
    alert(result.message ?? '유저 생성에 실패했습니다.');
  }
}

function updateUser() {
  const username = document.getElementById('edit-username').value;
  const pwRaw = document.getElementById('edit-pw-value').value;
  const permissions = collectPermissions('edit-perm-list');

  const body = { username, permissions };
  if (pwRaw) {
    body.password = sha256(pwRaw);
  }

  httpRequest(
    'PATCH',
    '/users',
    body,
    'Fail to update user',
    cb_updateUser,
  );
}

function cb_updateUser(result) {
  if (result.success) {
    closeEditUserDialog();
    location.reload();
  } else {
    alert(result.message ?? '유저 수정에 실패했습니다.');
  }
}

function removeUser(parent) {
  const userId = parent.dataset.user;
  httpRequest(
    'DELETE',
    '/users',
    { username: userId },
    'Fail to remove user',
    (result) => cb_removeUser(result, parent),
  );
}

function cb_removeUser(result, parent) {
  if (!result.success) {
    alert(result.message);
    return;
  }
  parent.remove();
}
