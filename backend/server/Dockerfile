# backend/Dockerfile
FROM node:23

WORKDIR /server

COPY package.json package-lock.json ./

RUN npm install

RUN npm install -g typescript @types/node typeorm pg reflect-metadata ts-node

COPY . .

EXPOSE 3010

RUN npx tsc --outDir dist

CMD ["sh", "-c", "npx tsc -w & npx nodemon"]
# CMD ["sh", "-c", "npx tsc && (npx tsc -w & npx nodemon)"]