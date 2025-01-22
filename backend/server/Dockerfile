# backend/Dockerfile
FROM node:23

WORKDIR /server

COPY package.json package-lock.json ./

RUN npm install
RUN npm install sequelize pg pg-hstore
RUN npm install -g typescript sequelize-cli
RUN npm install -g ts-node

COPY . .

RUN npx tsc

EXPOSE 3010

CMD ["sh", "-c", "npx tsc -w & npx nodemon"]
