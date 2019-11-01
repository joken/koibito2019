FROM node:12-alpine

COPY --from=lafr4nc3/libfaketime /libfaketimeMT.so.1 /lib/faketime.so
ENV LD_PRELOAD=/lib/faketime.so

ENV NODE_ENV=production

WORKDIR /usr/src/koibito2019-backend

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

EXPOSE 3000
USER node
CMD ["yarn", "start"]
