# Docker Setup Documentation - USAsset API

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Development Setup](#development-setup)
- [Production Setup](#production-setup)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)
- [Performance Optimization](#performance-optimization)
- [CI/CD Integration](#cicd-integration)

## Overview

The USAsset API uses Docker for containerized deployment with the following components:
- **Backend**: NestJS API with Prisma ORM
- **Database**: PostgreSQL 15
- **Frontend**: React with Vite (optional)

### Key Features
- Multi-stage builds for optimal image size
- Security hardening with non-root users
- Health checks for container orchestration
- Proper signal handling for graceful shutdown
- Support for both development and production environments

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB free disk space

## Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/your-org/usasset-api.git
cd usasset-api
```

### 2. Set up environment variables
```bash
cp apps/backend/.env.example apps/backend/.env
# Edit .env with your configuration
```

### 3. Start all services
```bash
docker-compose up -d
```

### 4. Verify services are running
```bash
# Check container status
docker-compose ps

# Check backend health
curl http://localhost:3000/health

# View logs
docker-compose logs -f backend
```

## Architecture

### Container Structure
```
usasset-api/
├── docker-compose.yml           # Development compose file
├── docker-compose.prod.yml      # Production compose file
├── .dockerignore                # Files to exclude from build context
├── apps/
│   ├── backend/
│   │   ├── Dockerfile          # Development Dockerfile
│   │   ├── Dockerfile.production # Production Dockerfile
│   │   └── docker-entrypoint.sh # Startup script
│   └── frontend/
│       └── Dockerfile          # Frontend Dockerfile
```

### Build Stages

#### Backend Multi-Stage Build
1. **Dependencies Stage**: Install all npm packages
2. **Builder Stage**: Compile TypeScript and generate Prisma client
3. **Production Stage**: Minimal runtime with only production dependencies

### Network Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Frontend     │────▶│    Backend      │────▶│   PostgreSQL    │
│   (port 80)     │     │   (port 3000)   │     │   (port 5432)   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Development Setup

### Starting Development Environment
```bash
# Start with live reload
docker-compose up

# Or run in background
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Development Features
- **Hot Reload**: Code changes automatically restart the server
- **Volume Mounts**: Local code synced to container
- **Debug Ports**: Exposed for debugger attachment
- **Seed Data**: Automatically seeds database on first run

### Accessing Services
- Backend API: http://localhost:3000
- Frontend: http://localhost:5173
- PostgreSQL: localhost:5433 (mapped from 5432)

### Database Management
```bash
# Run migrations
docker-compose exec backend npx prisma migrate dev

# Generate Prisma client
docker-compose exec backend npx prisma generate

# Open Prisma Studio
docker-compose exec backend npx prisma studio

# Seed database
docker-compose exec backend npx prisma db seed

# Reset database
docker-compose exec backend npx prisma migrate reset
```

## Production Setup

### Building for Production
```bash
# Build production image
docker build -f apps/backend/Dockerfile.production -t usasset-backend:prod .

# Or use docker-compose
docker-compose -f docker-compose.prod.yml build
```

### Running in Production
```bash
# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# With environment variables
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### Production Configuration
```yaml
# docker-compose.prod.yml example
services:
  backend:
    image: usasset-backend:prod
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

### Health Monitoring
```bash
# Check health endpoint
curl http://localhost:3000/health

# Docker health check
docker inspect --format='{{.State.Health.Status}}' usasset-backend

# Container resource usage
docker stats usasset-backend
```

## Troubleshooting

### Common Issues and Solutions

#### 1. npm install hanging in Docker build
**Problem**: Build hangs indefinitely on `npm install`
**Solution**: 
- Use `npm ci` instead of `npm install`
- Ensure package-lock.json exists
- Add OpenSSL for Alpine: `RUN apk add --no-cache openssl`

#### 2. Prisma client not found
**Problem**: `Cannot find module '@prisma/client'`
**Solution**:
- Remove custom output path in schema.prisma
- Use default Prisma client location
- Copy Prisma binaries in Dockerfile:
```dockerfile
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
```

#### 3. Database connection failed
**Problem**: Backend can't connect to PostgreSQL
**Solution**:
- Check DATABASE_URL environment variable
- Ensure postgres service is healthy: `docker-compose ps`
- Verify network connectivity: `docker-compose exec backend ping postgres`

#### 4. Permission denied errors
**Problem**: Container fails with permission errors
**Solution**:
- Run as non-root user: `USER 1000`
- Set proper ownership: `chown -R 1000:1000 /app`
- Check volume mount permissions

### Debug Commands
```bash
# Enter container shell
docker-compose exec backend sh

# Check environment variables
docker-compose exec backend env

# Test database connection
docker-compose exec backend npx prisma db pull

# View real-time logs
docker-compose logs -f --tail=100 backend

# Inspect container
docker inspect usasset-backend

# Check network
docker network inspect usasset-api_default
```

## Security Considerations

### Image Security
1. **Non-root User**: Container runs as UID 1000
2. **Minimal Base Image**: Alpine Linux reduces attack surface
3. **No Unnecessary Tools**: Production image excludes build tools
4. **Secrets Management**: Use Docker secrets or environment variables
5. **Read-only Filesystem**: Compatible with read-only mounts

### Security Scanning
```bash
# Scan for vulnerabilities
docker scan usasset-backend:prod

# Check image layers
docker history usasset-backend:prod

# Verify user
docker run --rm usasset-backend:prod whoami
```

### Best Practices
- Never commit .env files
- Use specific image tags, not `latest`
- Regularly update base images
- Implement resource limits
- Use health checks
- Enable Docker content trust

## Performance Optimization

### Image Size Optimization
- Multi-stage builds reduce final image from ~1GB to ~150MB
- Alpine Linux base image (5MB)
- Only production dependencies in final image
- Cleaned npm cache

### Build Performance
- Layer caching for dependencies
- .dockerignore excludes unnecessary files
- Parallel builds where possible
- BuildKit optimizations enabled

### Runtime Performance
```yaml
# Resource limits
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 512M
    reservations:
      cpus: '0.5'
      memory: 256M
```

### Monitoring
```bash
# Real-time resource usage
docker stats

# Container metrics
docker exec backend node -e "console.log(process.memoryUsage())"

# Database connections
docker-compose exec postgres psql -U dbadmin -c "SELECT count(*) FROM pg_stat_activity;"
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Docker Build and Push

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -f apps/backend/Dockerfile.production -t usasset-backend:${{ github.sha }} .
      
      - name: Run tests
        run: docker run --rm usasset-backend:${{ github.sha }} npm test
      
      - name: Push to registry
        run: |
          echo ${{ secrets.REGISTRY_PASSWORD }} | docker login -u ${{ secrets.REGISTRY_USER }} --password-stdin
          docker push usasset-backend:${{ github.sha }}
```

### Azure Container Registry
```bash
# Login to ACR
az acr login --name myregistry

# Tag image
docker tag usasset-backend:prod myregistry.azurecr.io/usasset-backend:v1.0.0

# Push to ACR
docker push myregistry.azurecr.io/usasset-backend:v1.0.0
```

## Maintenance

### Cleanup Commands
```bash
# Remove stopped containers
docker-compose rm -f

# Remove unused images
docker image prune -a

# Remove all volumes (WARNING: deletes data)
docker-compose down -v

# Full cleanup
docker system prune -a --volumes
```

### Backup and Restore
```bash
# Backup database
docker-compose exec postgres pg_dump -U dbadmin usasset > backup.sql

# Restore database
docker-compose exec -T postgres psql -U dbadmin usasset < backup.sql
```

## References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Docker Guide](https://docs.nestjs.com/recipes/docker)
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/deployment/docker)
- [Alpine Linux Package Management](https://wiki.alpinelinux.org/wiki/Alpine_Linux_package_management)