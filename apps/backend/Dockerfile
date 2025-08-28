# Multi-stage build - proper approach
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files from monorepo root
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
RUN npm ci

# Copy source and build
COPY apps/backend ./apps/backend/
RUN cd apps/backend && npx prisma generate
RUN cd apps/backend && npm run build

# Production stage
FROM node:20-alpine AS production

# Install netcat for health checks
RUN apk add --no-cache netcat-openbsd

WORKDIR /app

# Change ownership to node user (UID 1000 matches host user)
RUN chown -R 1000:1000 /app

# Copy package files and install production deps
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
RUN npm ci --omit=dev && cd apps/backend && npm install prisma

# Copy built app and generated client with correct ownership
COPY --from=builder --chown=1000:1000 /app/apps/backend/dist ./dist
COPY --from=builder --chown=1000:1000 /app/apps/backend/generated ./generated

# Copy Prisma schema for migrations
COPY --chown=1000:1000 apps/backend/prisma ./prisma

# Copy entrypoint script
COPY --chown=root:root apps/backend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Switch to node user (UID 1000)
USER 1000

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/src/main.js"]