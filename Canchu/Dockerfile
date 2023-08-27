FROM node:18.17.0-alpine

WORKDIR /usr/src/server

COPY . . 
# RUN apt-get update && apt-get install -y vim 
# RUN npm install -qg pm2 && npm install --production
# RUN apk update && apk add --no-cache vim && \
#     npm install -qg pm2 && npm install --production
RUN mkdir -p /canchu/static && \
    npm install -g pm2 && npm install --production && \
    npm install -g jest && npm install supertest --save-dev

EXPOSE 3000

# 執行應用程式
# CMD ["pm2-runtime", "server.js"]
CMD ["sh", "-c", "while ! nc -z database-1.cit31pok2rbv.ap-southeast-2.rds.amazonaws.com 3306; do sleep 1; done && pm2-runtime server.js"]