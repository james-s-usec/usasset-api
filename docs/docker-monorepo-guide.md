# Docker Build Guide for npm Workspaces Monorepo

## Problem Statement
Building Docker images in a monorepo with npm workspaces can be extremely slow (10+ minutes) if not configured correctly. The main issues are:
- Missing `package-lock.json` access
- Using `npm install` instead of `npm ci`
- Incorrect build contexts
- Alpine Linux + Prisma compatibility issues

## Solution: Correct Build Context & npm ci

### Key Principle
**The Docker build context must be at the monorepo root** to access the shared `package-lock.json` file.

## Step-by-Step Setup

### 1. Monorepo Structure
```
usasset-api/
├── package.json          # Root package.json with workspaces
├── package-lock.json     # CRITICAL: Shared lock file
├── docker-compose.yml    # Docker compose configuration
├── apps/
│   ├── backend/
│   │   ├── package.json
│   │   └── Dockerfile
│   └── frontend/
│       ├── package.json
│       └── Dockerfile
```

### 2. Docker Compose Configuration
```yaml
# docker-compose.yml
services:
  backend:
    build:
      context: .                    # ROOT context, not ./apps/backend
      dockerfile: apps/backend/Dockerfile  # Path from root
    # ... rest of config

  frontend:
    build:
      context: .                    # ROOT context, not ./apps/frontend
      dockerfile: apps/frontend/Dockerfile  # Path from root
    # ... rest of config
```

### 3. Backend Dockerfile Template
```dockerfile
# apps/backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files from monorepo root AND workspace
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Use npm ci for fast, reproducible builds
RUN npm ci

# Copy backend source
COPY apps/backend ./apps/backend/

# Build steps (adjust for your framework)
RUN cd apps/backend && npx prisma generate
RUN cd apps/backend && npm run build

# Production stage
FROM node:20-alpine AS production

RUN apk add --no-cache netcat-openbsd  # For health checks

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Install production dependencies only
RUN npm ci --omit=dev && cd apps/backend && npm install prisma

# Copy built application
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/generated ./generated

# Copy other necessary files
COPY apps/backend/prisma ./prisma
COPY apps/backend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
```

### 4. Frontend Dockerfile Template
```dockerfile
# apps/frontend/Dockerfile
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files from monorepo root AND workspace
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/

# Use npm ci for fast builds
RUN npm ci

# Copy frontend source
COPY apps/frontend ./apps/frontend/

# Build the frontend
RUN cd apps/frontend && npm run build

# Production stage with nginx
FROM nginx:alpine
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Performance Comparison

### Before (Wrong Setup)
- Build context: `./apps/backend`
- Command: `npm install`
- No access to `package-lock.json`
- **Build time: 11+ minutes**

### After (Correct Setup)
- Build context: `.` (root)
- Command: `npm ci`
- Uses `package-lock.json`
- **Build time: ~1 minute**

## Common Issues & Solutions

### Issue 1: "No package-lock.json found"
**Cause**: Build context doesn't include root directory
**Solution**: Set context to `.` in docker-compose.yml

### Issue 2: Slow npm install in Docker
**Cause**: Using `npm install` instead of `npm ci`
**Solution**: Always use `npm ci` in Docker builds

### Issue 3: Prisma hanging in Alpine
**Cause**: Known Prisma postinstall script issues with Alpine
**Solution**: 
- Use `npm ci` (not `npm install`)
- Consider `node:20-slim` (Debian) if issues persist

### Issue 4: Files not found during build
**Cause**: Incorrect paths after changing context
**Solution**: Update all COPY commands to include `apps/backend/` prefix

## Testing Your Setup

1. **Clean rebuild test**:
```bash
docker-compose down
docker-compose build --no-cache backend
# Should complete in ~1-2 minutes
```

2. **Verify services**:
```bash
docker-compose up -d
docker-compose ps
# All services should be "Up" and healthy
```

3. **Check logs**:
```bash
docker-compose logs backend
docker-compose logs frontend
# Should show successful startup
```

## Optimization Tips

1. **Order Dockerfile commands for better caching**:
   - Copy package files first
   - Run npm ci
   - Copy source files
   - Run build commands

2. **Use multi-stage builds**:
   - Builder stage with all dev dependencies
   - Production stage with only runtime dependencies

3. **Leverage Docker BuildKit**:
   ```bash
   export DOCKER_BUILDKIT=1
   docker-compose build
   ```

4. **For even faster builds**, consider:
   - Docker layer caching in CI/CD
   - Pre-built base images with common dependencies
   - BuildKit cache mounts for npm cache

## Key Takeaways

✅ **Always** set Docker build context to monorepo root  
✅ **Always** use `npm ci` instead of `npm install` in Docker  
✅ **Always** ensure `package-lock.json` is accessible  
✅ **Always** test with `--no-cache` to verify build works from scratch  

## Example Build Times

With this setup on a typical NestJS + React monorepo:
- Initial build: ~1-2 minutes
- Cached build (no changes): ~5 seconds
- Cached build (code changes only): ~30 seconds
- Full rebuild (--no-cache): ~1-2 minutes

Compare to incorrect setup:
- Any build: 10-15+ minutes
- Often hangs indefinitely with Prisma