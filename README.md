# shorttpd
Simple Http Web Server For Serving Static Files

## Latest Version: 0.0.3

## Demo
<img width="1600" alt="Demo Preview" src="https://user-images.githubusercontent.com/65178775/215252787-e6b80509-be23-4796-8cc8-f1ecdc5d9ea5.gif">

# Usage

## Customize HTML
- You can Customize Shorttpd's Design
- You can change the html under `/html/public/fragment`. Please do not change other things. It won't be work.
- Of course, I hope you have used SHORTTPD, and know the structure well....
- Sorry for my poor explain, I will update it later...

## Authorization
- If you want to use auth feature, please set `use_auth=yes` on shorttpd.conf
- Please set `server_key` to your private key for admin password.
- Please set `admin_page_prefix` for connecting your admin page. uri will be `/{admin_page_prefix}/unite_admin.html`.
- Everytime you connect to admin page or creating & removing user, the page will request `server_key` all the time.
- After you added the user, you can login with the user for static web server of files whatever.



## Docker
- Set shorttpd.conf * Please do not change section such that [addresses], [auth], [http] ...
```
[addresses]
bind_port=3080

[auth]
use_auth=no

[http]
web_view_extension=txt,json,conf,ini,png,jpeg,jpg,gif
```
- `addresses`: Section that set shorttpd's address info. for now, only port is available
- `addresses.bind_port`: binding port for the container.
- `auth`: Section that set Authentication.
- `auth.use_auth`: use authentication or not.
- `http`: Section that set basic serving info
- `http.web_view_extension`: extensions registered here will be shown on web browser as default, not downloading.
- `http.web_cookie_name=SHORTTPD_COOKIE`: cookie name of using authorization feature. it is set on front-side's app.js, as`__AUTH_NAME__`. both must be match.
- Mount your directory for serving into /app/serve.

### Default shorttpd.conf
```
[addresses]
bind_port=3080

[auth]
use_auth=yes
server_key=shorttpd_password
admin_page_prefix=/admin

[http]
web_view_extension=txt,json,conf,ini,png,jpeg,jpg,gif
web_cookie_name=SHORTTPD_COOKIE
```
- If you don't change default shorttpd.conf, it will work with above options.

### Run with default shorttpd.conf
`docker run --rm -p 3080:3080 -v /shorttpd/serve:/app/serve --name shorttpd devwhoan/shorttpd:0.0.3`

### Run with modified shorttpd.conf
`docker run --rm -p 3080:3080 -v /shorttpd/shorttpd.conf:/app/shorttpd.conf -v /shorttpd/serve:/app/serve --name shorttpd devwhoan/shorttpd:0.0.3`
