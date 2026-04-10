FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production --no-fund --quiet
COPY . .
EXPOSE 4001
CMD ["node", "server.js"]
