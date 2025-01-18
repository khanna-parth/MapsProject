# backend/Dockerfile
FROM node:23

WORKDIR /app

COPY package.json ./

ENV NODE_ENV=development

RUN npm install

RUN npm install typescript --global
RUN npm install typescript --save-dev --global
RUN npm install @types/node --save-dev


COPY . .

EXPOSE 3010

CMD ["sh", "-c", "npx tsc -w & npx nodemon"]