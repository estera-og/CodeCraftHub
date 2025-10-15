FROM node:20-alpine

# App directory
WORKDIR /usr/src/app

# Environment
ENV NODE_ENV=production

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY src ./src
COPY users.json ./users.json
COPY .env.example ./.env.example

# Expose service port
EXPOSE 3000

# Start the service
CMD ["node", "src/config/server.js"]
