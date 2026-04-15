FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY services/telemetry-service/ .
EXPOSE 3001
CMD ["node", "index.js"]