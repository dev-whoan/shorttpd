window.onload=function(){function a(a,b){var c=/^(?:file):/,d=new XMLHttpRequest,e=0;d.onreadystatechange=function(){4==d.readyState&&(e=d.status),c.test(location.href)&&d.responseText&&(e=200),4==d.readyState&&200==e&&(a.outerHTML=d.responseText)};try{d.open("GET",b,!0),d.send()}catch(f){}}var b,c=document.getElementsByTagName("*");for(b in c)c[b].hasAttribute&&c[b].hasAttribute("data-include")&&a(c[b],c[b].getAttribute("data-include"));setBodyPath();addFileClickHandler();};
function setBodyPath(){
    const pathName = location.pathname;
    const pathTag = document.getElementById('current-location');

    let decoded = decodeURI(pathName);
    // 디코딩 후, 기존과 다르면 encode 된 것임
    if(decoded === pathName){
        decoded = pathName;
    }

    if(pathTag){
        pathTag.innerText = decoded;
    }
}
function addFileClickHandler(){
    const pathName = location.pathname;
    const files = document.getElementsByClassName('file-name');
    for(let i = 0; i < files.length; i++){
        const file = files[i];
        file.addEventListener('click', function(e)
            {
                const fileName = file.innerText;
                let uri = (pathName !== '/')
                ? location.origin + pathName + '/' + fileName
                : location.origin + '/' + fileName;

                if(fileName === '..'){
                    let paths = pathName.split('/');
                    uri = location.origin;
                    if(paths.length === 2){
                        location.href = location.origin;
                        return;
                    }

                    for(let i = 1; i < paths.length-1; i++){
                        uri += '/' + paths[i];
                    }
                }
                if(uri.substring(uri.length-1) === '/'){
                    uri = uri.substring(0, uri.length-1);
                }
                location.href = uri;
            }
        );
    }
}
/**
 * Login
 * Let it user be able to login
 */

function goLogin(){
    const loginForm = document.getElementById('user-login');
    if(!loginForm){
        return;
    }

    const idValue = loginForm.querySelector('input#id-value').value;
    const hash = sha256(loginForm.querySelector('input#pw-value').value);

    httpRequest(
        'POST', 
        '/auth/login',
        {
            name: idValue,
            password: hash
        },
        'Fail to login',
        function(result){
            if(result.code === 200){
                const cookieData = `${idValue}:${hash}`;
                document.cookie = createCookie(cookieData);
                location.href = '/';
                return;
            }
        }
    );
}

function logout(){
    removeTokenCookie();
    alert("Bye!");
    location.href='/';
}

/**
 * Cookie Section
 * Let it user be able to login
 */
const __AUTH_LIFETIME__ = 300;
const __AUTH_NAME__ = 'SHORTTPD_COOKIE';

/**
 * Create Cookie With Given Info
 * @param {string} token; {username}:{password}, password is encrypted with sha256
 * @returns 
 */
function createCookie(token){
    const date = new Date();
    date.setTime(date.getTime() + __AUTH_LIFETIME__ * 1000);
//    date.setTime(date.getTime() + __AUTH_LIFETIME__);
    let cookieInfo = __AUTH_NAME__ + '=' + token + ';expires=' + date.toUTCString() + ';path=/';
    return cookieInfo;
}

function getToken(){
    const value = document.cookie.match('(^|;) ?' + __AUTH_NAME__ + '=([^;]*)(;|$)');
    return value ? value[2] : null;
}

function removeTokenCookie(cookieInfo) {
    var date = new Date();
    document.cookie = __AUTH_NAME__ + "= ; expires=" + date.toUTCString() + "; path=/";
}

/**
 * Http Request
 */
function httpRequest(method, url, body, errorMsg, callback) {
    var http = new XMLHttpRequest();
    http.open(method, url, true);
    http.setRequestHeader('Content-type', 'application/json');
    http.addEventListener('readystatechange', processRequest, false);
    http.send(JSON.stringify(body));

    function processRequest() {
        if (http.readyState === 4) {
            if (http.status >= 200 && http.status < 400) {
                try {
                    callback(JSON.parse(http.responseText));
                } catch (e) {
                    callback(e);
                }
            } else {
                if(http.status === 401){
                    alert("Fail to login!");
                    callback(JSON.parse(http.responseText));
                }
                console.error(http.status);
            }
        }
    }
}

function drawUserList(_key){
    const parent = document.getElementById('user-list-table');

    if(!parent){
        return;
    }

    parent.innerHTML = "";

    let baseTr = document.createElement('tr');
    baseTr.id = 'table-header';
    
    let baseTd1 = document.createElement('td');
    baseTd1.innerText = 'User Id';
    let baseTd2 = document.createElement('td');
    baseTd2.innerText = 'Permissions';

    baseTr.append(baseTd1, baseTd2);
    parent.append(baseTr);

    httpRequest(
        'POST',
        '/manage/users',
        {
            key: _key
        },
        'Fail to get users',
        function(result){
            if(result.code === 401){
                location.href = '/';
                return;
            }

            if(result.code === 200){
                const users = result.data;

                users.data.forEach((user, index) => {
                    let oneTr = document.createElement('tr');
                    oneTr.classList.add('one-user');
                    
                    let id = user.name;
                    let perm = user.perm;

                    let idTd = document.createElement('td');
                    idTd.innerText = id;
                    let permTd = document.createElement('td');
                    permTd.innerText = perm;

                    oneTr.append(idTd, permTd);
                    parent.append(oneTr);
                });
            }
        }
    );
}

function showUserAddPopup(){
    const target = document.getElementById('user-add-popup');
    if(!target){
        return;
    }

    target.style.display = 'block';
}

function registerUser(){
    const parent = document.getElementById('user-add-popup');
    if(!parent){
        return;
    }

    const id = parent.querySelector('#id-value').value;
    const pw = sha256(parent.querySelector('#pw-value').value);
    const prompt = document.getElementById('prompt');
    const promptOk = prompt.querySelector('#btn-ok');
    const promptNo = prompt.querySelector('#btn-no');

    prompt.style.display = 'block';
    promptNo.onclick = () => {
        prompt.style.display = 'none';
    };
    promptOk.onclick = () => {
        const key = prompt.querySelector('#key-value');
        const _key = key.value;
        httpRequest(
            'POST',
            '/manage/register',
            {
                id: id,
                pw: pw,
                key: _key
            },
            'Fail to get users',
            function(result){
                if(result.code === 409){
                    alert("User Already Exist!")
                    return;
                }

                if(result.code === 201){
                    alert("User Created");
                    closeUserAddPopup();

                    drawUserList(_key);
                    return;
                }

                console.error("Unknown error: ", result);
            }
        );
        key.value = '';
        prompt.style.display = 'none';
    };
}

function closeUserAddPopup(){
    const target = document.getElementById('user-add-popup');
    if(!target){
        return;
    }

    target.style.display = 'none';
}

function showUserRemovePopup(){
    const target = document.getElementById('user-remove-popup');
    if(!target){
        return;
    }

    target.style.display = 'block';
}

function deleteUser(){
    const parent = document.getElementById('user-remove-popup');
    if(!parent){
        return;
    }

    const id = parent.querySelector('#id-remove').value;
    const prompt = document.getElementById('prompt');
    const promptOk = prompt.querySelector('#btn-ok');
    const promptNo = prompt.querySelector('#btn-no');

    prompt.style.display = 'block';
    promptNo.onclick = () => {
        prompt.style.display = 'none';
    };
    promptOk.onclick = () => {
        const key = prompt.querySelector('#key-value');
        const _key = key.value;
        httpRequest(
            'POST',
            '/manage/unregister',
            {
                id: id,
                key: _key
            },
            'Fail to get users',
            function(result){
                if(result.code === 409){
                    alert("User Already Exist!")
                    return;
                }
    
                if(result.code === 201 || result.code === 200){
                    alert("User Removed");
                    closeUserAddPopup();
                    drawUserList(_key);
                    return;
                }
    
                console.error("Unknown error: ", result);
            }
        );
        key.value = '';
        prompt.style.display = 'none';
    };
}

function closeUserRemovePopup(){
    const target = document.getElementById('user-remove-popup');
    if(!target){
        return;
    }

    target.style.display = 'none';
}