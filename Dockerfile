FROM node:4.2.2

RUN mkdir -p /opt/tweet-router
WORKDIR /opt/tweet-router

COPY . /opt/tweet-router

RUN npm install

CMD [ "node", "index" ]