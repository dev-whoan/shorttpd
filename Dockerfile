FROM node:22-alpine
LABEL email="dev.whoan@gmail.com"
LABEL name="Eugene Minwhoan Kim"
LABEL version="0.0.5"
LABEL description="Shorttpd:: Simple Http Web Server That Serving Static Files"

###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:22-slim As development

WORKDIR /app

COPY --chown=node:node package*.json yarn.lock ./

RUN yarn install

COPY --chown=node:node . .

USER node

###################
# BUILD FOR PRODUCTION
###################

FROM node:22-slim As build

ENV NODE_ENV production

WORKDIR /app

COPY --chown=node:node package*.json yarn.lock ./

COPY --chown=node:node --from=development /app/node_modules ./node_modules

COPY --chown=node:node . .

RUN yarn run build && \
    rm -rf node_modules && \
    yarn install --production --ignore-scripts --prefer-offline && \
    yarn remove @nestjs/cli @nestjs/schematics @nestjs/testing \
      @types/bcrypt @types/express @types/jest @types/multer @types/node \
      @types/passport-jwt @types/passport-local @types/supertest \
      @typescript-eslint/eslint-plugin @typescript-eslint/parser \
      eslint eslint-config-prettier eslint-plugin-prettier jest prettier \
      source-map-support supertest ts-jest ts-loader ts-node tsconfig-paths typescript \
      2>/dev/null || true && \
    rm -rf node_modules/typeorm/browser && \
    rm -rf node_modules/@types/node && \
    find node_modules/sqlite3 \
      \( -name "*.c" -o -name "*.h" -o -name "*.cc" \
         -o -name "Makefile" -o -name "*.gyp" -o -name "*.gypi" \) -delete && \
    find node_modules \
      \( -name "CHANGELOG*" -o -name "LICENSE*" -o -name "*.map" \) -delete && \
    rm -rf node_modules/node-gyp node_modules/.cache

###################
# PRODUCTION
###################

FROM gcr.io/distroless/nodejs22-debian12:nonroot As production

WORKDIR /shorttpd

COPY --from=build /usr/bin/sh /bin/sh

COPY --chown=nonroot:nonroot --from=build /app/node_modules /shorttpd/node_modules
COPY --chown=nonroot:nonroot --from=build /app/dist /shorttpd/dist
COPY --chown=nonroot:nonroot --from=build /app/views /shorttpd/views
COPY --chown=nonroot:nonroot --from=build /app/public /shorttpd/public

CMD [ "/shorttpd/dist/main.js" ]
