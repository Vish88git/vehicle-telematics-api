FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY services/fault-service/ .
EXPOSE 3002
CMD ["node", "index.js"]