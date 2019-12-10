FROM node:10
WORKDIR /usr/src/app
RUN mkdir data
COPY ["package*.json", "handler.js", "./"]
RUN npm install
CMD ["/usr/local/bin/node", "handler.js"]
