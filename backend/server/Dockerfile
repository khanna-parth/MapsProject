# backend/Dockerfile
FROM node:23

WORKDIR /server

COPY package.json package-lock.json ./

RUN npm install

RUN npm install -g typescript @types/node typeorm pg reflect-metadata ts-node

COPY . .

EXPOSE 3010

# Specify outDir in tsconfig or compile to dist
RUN npx tsc --outDir dist

# Run the compiled JavaScript files
CMD ["npx", "nodemon", "./dist/server.js"]