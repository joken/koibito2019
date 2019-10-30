FROM node:12-alpine
LABEL maintainer="Mintaka Orionis <mintaka@0x9.pw>"

ENV NODE_ENV=production

WORKDIR /usr/src/koibito2019-frontend

COPY package.json yarn.lock ./
RUN yarn install

COPY . .
RUN yarn run build

EXPOSE 3000
USER node
CMD ["yarn", "start"]
