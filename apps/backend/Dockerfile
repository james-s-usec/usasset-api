# Multi-stage build - optimized for monorepo
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma (required for Alpine)
RUN apk add --no-cache openssl

# Copy package files from monorepo root
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Use npm ci for faster, reliable builds with package-lock.json
RUN npm ci

# Copy source files
COPY apps/backend ./apps/backend/

# Generate Prisma client and build
WORKDIR /app/apps/backend
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache openssl netcat-openbsd

WORKDIR /app

# Copy package files and install production deps only
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
RUN npm ci --omit=dev

# Copy Prisma client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built application
WORKDIR /app/apps/backend
COPY --from=builder --chown=1000:1000 /app/apps/backend/dist ./dist

# Copy Prisma schema for migrations
COPY --chown=1000:1000 apps/backend/prisma ./prisma

# Copy and setup entrypoint script
COPY --chown=root:root apps/backend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Change ownership
RUN chown -R 1000:1000 /app

# Switch to non-root user
USER 1000

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]