# backend/Dockerfile
FROM node:23

WORKDIR /app

COPY package*.json ./

ENV NODE_ENV=development

RUN npm install

COPY . .

EXPOSE 3010

CMD ["sh", "-c", "npx tsc -w & npx nodemon"]