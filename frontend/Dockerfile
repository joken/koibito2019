FROM node:12-alpine as builder

WORKDIR /usr/src/koibito2019-frontend

COPY package.json yarn.lock ./
RUN yarn install

COPY . .
RUN yarn build


FROM node:12-alpine

COPY --from=lafr4nc3/libfaketime /libfaketimeMT.so.1 /lib/faketime.so
ENV LD_PRELOAD=/lib/faketime.so

WORKDIR /usr/src/koibito2019-frontend

ENV NODE_ENV=production

COPY package.json yarn.lock ./
RUN yarn install

COPY --from=builder /usr/src/koibito2019-frontend/.nuxt/ ./.nuxt/
COPY --from=builder /usr/src/koibito2019-frontend/static/ ./static/
COPY --from=builder /usr/src/koibito2019-frontend/nuxt.config.ts ./
COPY --from=builder /usr/src/koibito2019-frontend/tsconfig.json ./

EXPOSE 3000
USER node
CMD ["yarn", "start"]
