FROM node:16-alpine
LABEL email="dev.whoan@gmail.com"
LABEL name="Eugene Minwhoan Kim"
LABEL version="0.0.4"
LABEL description="Shorttpd:: Simple Http Web Server That Serving Static Files"

WORKDIR /app

COPY . .

RUN rm package-lock.json && rm -f node_modules
RUN npm i

RUN npm ci --only=production

COPY . /app

CMD [ "npm", "run", "start:prod" ]
