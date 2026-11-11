# ==============================================================================
# Production Dockerfile for Express & Socket.io Backend
# ==============================================================================
FROM node:24-alpine

# Set secure production environment
ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Run as non-root user for enterprise security
USER node

EXPOSE 5000

CMD ["node", "src/server.js"]

