FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY services/notification-service/ .
EXPOSE 3003
CMD ["node", "index.js"]