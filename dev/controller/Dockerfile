FROM node:18.16.1-slim

WORKDIR /app

COPY ./package.json ./
COPY ./package-lock.json ./

RUN npm install

RUN mkdir controller
RUN mkdir volumes
RUN mkdir -p dev/client/bundles

COPY . ./controller

# build client
RUN npx browserify -t [ babelify --presets [ @babel/preset-env @babel/preset-react ] ] controller/client/workspace/main.jsx -o controller/client/bundles/workspace.js --extension=.jsx

CMD [ "node", "controller/controllerServer.js" ]
