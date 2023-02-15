# shorttpd

Simple Http Web Server For Serving Static Files

## Latest Version: 0.0.4

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

# From 0.0.4, uses .env file not shorttpd.conf

- It is because that the project uses `NestJS` from version 0.0.4, not just `ExpressJS` (version until 0.0.3).

# env file

```env
PORT=3080

# Use Should Login to Use Shorttpd
USE_AUTH=yes
JWT_SECRET=__jwt_secret__

# Admin Setting
ADMIN_PAGE_PREFIX=/admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin

# Web View Setting
# Extensions to view directly at Web Browser
WEB_VIEW_EXTENSION=json,conf,ini,png,jpeg,jpg,gif,txt
# File name or Directory name not to show on shorttpd
WEB_VIEW_EXCLUDE=@eaDir
```

- If you don't prepare and don't mount `.env` file, application won't be started.
- `.env` file will be mounted into `/shorttpd/.env`

## Docker

- Set `.env` File
- Prepare files to share which will be mounted into `/shorttpd/serve/foo/bar`.
- Mount prefix path: `/shorttpd/serve`
- You can mount multiple files for example: `-v /foo:/shorttpd/serve/foo -v /bar:/shorttpd/serve/bar ...`

### Run

`docker run --rm -p 3080:3080 -v /shorttpd/.env:/shorttpd/.env -v /shorttpd/serve:/shorttpd/serve --name shorttpd devwhoan/shorttpd:0.0.4`
