FROM node:10-alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

# USER node

RUN npm install --only=prod

COPY --chown=node:node . .

EXPOSE 4002 4012

CMD [ "node", "./dist/index.js" ]