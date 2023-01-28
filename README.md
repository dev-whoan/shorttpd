# shorttpd
Simple Http Web Server For Serving Static Files

## Latest Version: 0.0.2

## Demo
<img width="1600" alt="Demo Preview" src="https://user-images.githubusercontent.com/65178775/215252787-e6b80509-be23-4796-8cc8-f1ecdc5d9ea5.gif">

# Usage
## Customize HTML
- You can Customize Shorttpd's Design

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
- `auth`: Section that set Authentication. Currently not supported. Everyone can access your shorttpd.
- `auth.use_auth`: use authentication or not.
- `http`: Section that set basic serving info
- `http.web_view_extension`: extensions registered here will be shown on web browser as default, not downloading.

- Mount your directory for serving into /app/serve.

`docker run --rm -p 3080:3080 -v /shorttpd/serve:/app/serve --name shorttpd devwhoan/shorttpd:0.0.2`
