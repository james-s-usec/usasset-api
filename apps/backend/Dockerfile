# Build stage
FROM node:20-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
RUN npx prisma generate

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install netcat for database health check
RUN apk add --no-cache netcat-openbsd

WORKDIR /app

COPY package*.json ./
# Need full dependencies including Prisma CLI for migrations
RUN npm install --production && npm install prisma

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated

# Copy Prisma files for migrations
COPY prisma ./prisma

# Copy and set permissions for entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]