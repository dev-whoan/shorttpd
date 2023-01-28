# shorttpd
Simple Http Web Server For Serving Static Files

## Latest Version: 0.0.1

# Usage
## Docker
- Mount your directory for serving into /app/serve.

`docker run --rm -p 3080:3080 -v /shorttpd/serve:/app/erve --name shorttpd devwhoan/shorttpd:0.0.1`