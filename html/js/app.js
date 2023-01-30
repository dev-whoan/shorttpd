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
            console.log("login result", result)
            if(result.code === 200){
                const cookieData = `${idValue}:${hash}`;
                document.cookie = createCookie(cookieData);
                location.href = '/';
            } else {
                alert("Fail to login!");
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
            if (http.status === 200 || http.status === 204) {
                try {
                    callback(JSON.parse(http.responseText));
                } catch (e) {
                    callback(e);
                }
            } else {
                if(http.status === 401){
                    alert("Fail to login!")
                }
                console.error(http.status);
            }
        }
    }
}