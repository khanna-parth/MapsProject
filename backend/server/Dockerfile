# backend/Dockerfile
FROM node:23

WORKDIR /app

COPY package*.json ./

RUN mkdir node_modules

ENV NODE_ENV=development

RUN npm install

RUN npm install -g typescript @types/node


COPY . .

EXPOSE 3010

CMD ["sh", "-c", "npx tsc -w & npx nodemon"]