FROM node:12-alpine
LABEL maintainer="Mintaka Orionis <mintaka@0x9.pw>"

ENV NODE_ENV=production

WORKDIR /usr/src/koibito2019-backend

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

EXPOSE 3000
USER node
CMD ["yarn", "start"]
