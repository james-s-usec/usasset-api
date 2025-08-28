# Docker Build Debug Log - USAsset API Backend

## Problem
Docker build hanging on `npm install` when trying to build the NestJS backend with Prisma.

## Root Cause Analysis
The primary issue is **Prisma postinstall scripts hanging in Alpine Linux Docker containers** - a known issue documented in GitHub issues.

## Attempts Made

### Attempt 1: Multi-stage build with Alpine
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
```
**Result**: Hung on `npm install` indefinitely

### Attempt 2: Added OpenSSL for Prisma
```dockerfile
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
```
**Result**: Still hung on `npm install`

### Attempt 3: Environment variables to fix Prisma binary targets
```dockerfile
ENV PRISMA_CLI_BINARY_TARGETS=native
ENV PRISMA_CLIENT_ENGINE_TYPE=binary
```
**Result**: Error "Unknown binaryTarget native"

### Attempt 4: Correct Alpine binary target
```dockerfile
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x
```
**Result**: Generated Prisma client but `npm run build` failed (nest not found - missing dev deps)

### Attempt 5: Switched to node:18-slim
```dockerfile
FROM node:18-slim AS builder
RUN apt-get update && apt-get install -y openssl
```
**Result**: Engine compatibility warnings (NestJS requires Node 20+)

### Attempt 6: Ignore postinstall scripts
```dockerfile
RUN npm install --ignore-scripts
```
**Result**: Still hung

### Attempt 7: Monorepo path issues
- Changed docker-compose context from `./apps/backend` to `.` (root)
- Updated Dockerfile paths to handle monorepo structure
**Result**: Build context issues, files not found

### Attempt 8: Found working reference
Discovered `/home/james/projects/usasset-api-service/Dockerfile` that works:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci  # <-- KEY DIFFERENCE: uses npm ci with package-lock.json
COPY . .
RUN npx prisma generate
RUN npx nest build
CMD ["npm", "run", "start:prod"]
```

### Attempt 9: Generate package-lock.json
```bash
cd /home/james/projects/usasset-api/apps/backend
npm install --package-lock-only
```
**Result**: Did not generate package-lock.json (npm workspaces issue)

### Attempt 10: Use npm ci with package-lock
```dockerfile
COPY package*.json ./
RUN npm ci
```
**Result**: Error - no package-lock.json found

### Attempt 11: Back to npm install
```dockerfile
RUN npm install
```
**Result**: Still hanging on `npm install`

## Current Status
- **Issue**: `npm install` hangs indefinitely in Alpine Linux containers
- **Root Cause**: Known Prisma postinstall script issue in Alpine/Docker environments
- **Working Solution**: Found in `usasset-api-service` repo, uses `npm ci` with package-lock.json
- **Blocker**: Current repo uses npm workspaces, no individual package-lock.json generated

## Next Steps to Try
1. **Generate proper package-lock.json**:
   ```bash
   cd apps/backend
   rm -rf node_modules
   npm install
   # Force creation of package-lock.json
   ```

2. **Copy working Dockerfile exactly** from `usasset-api-service`

3. **Alternative: Skip Docker for now** and deploy directly to Azure Container Apps from source

4. **Use Debian base image** instead of Alpine:
   ```dockerfile
   FROM node:20-slim
   RUN apt-get update && apt-get install -y openssl netcat-openbsd
   ```

## Key Findings
- **Alpine + Prisma + npm = known hanging issue**
- **npm ci requires package-lock.json** 
- **usasset-api-service works** - copy that approach exactly
- **Multi-stage builds are fine** - issue is npm/Prisma, not Docker architecture

## Time Spent
~2 hours debugging Docker build issues when the solution exists in another working repo.