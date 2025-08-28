# Docker Local Setup Guide

This guide explains how to run USAsset locally using Docker, mirroring the Azure production environment.

## Prerequisites
- Docker Desktop installed and running
- Docker Compose v2
- At least 4GB RAM available for Docker
- Ports 3000, 5173, and 5433 available

## Quick Start

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Database**: localhost:5433 (PostgreSQL)

## Services Architecture

### Database (PostgreSQL 15)
- **Container**: usasset-postgres
- **Port**: 5433 (mapped from 5432)
- **Credentials**: 
  - User: `dbadmin`
  - Password: `localpassword123`
  - Database: `usasset`

### Backend (NestJS API)
- **Container**: usasset-backend
- **Port**: 3000
- **Environment Variables**:
  - `NODE_ENV=development`
  - `CORS_ORIGIN=http://localhost:5173`
  - `DATABASE_URL=postgresql://dbadmin:localpassword123@postgres:5432/usasset`
  - `JWT_SECRET=local-jwt-secret-for-dev`
  - `LOG_TO_FILE=false`

### Frontend (React + nginx)
- **Container**: usasset-frontend
- **Port**: 5173 (mapped from nginx port 80)
- **Build Args**:
  - `VITE_API_URL=http://localhost:3000`

## CORS Configuration

The backend is configured to accept requests from the frontend URL specified in `CORS_ORIGIN`.

**Default CORS Settings**:
- Development: `http://localhost:5173`
- Production (Azure): Set via Container App environment variable

### Testing CORS
```bash
# Test CORS headers
curl -I -H "Origin: http://localhost:5173" \
  http://localhost:3000/health

# Should see: Access-Control-Allow-Origin: http://localhost:5173
```

## Common Commands

### Start Services
```bash
# Start all services
docker-compose up

# Start specific service
docker-compose up backend

# Rebuild and start
docker-compose up --build
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean database)
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend

# Follow logs (real-time)
docker-compose logs -f backend
```

### Database Access
```bash
# Connect to database
docker exec -it usasset-postgres psql -U dbadmin -d usasset

# Run migrations manually
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose up -d backend -e RUN_SEED=true
```

### Troubleshooting

#### Backend won't start
```bash
# Check if database is ready
docker-compose ps postgres

# Check backend logs
docker-compose logs backend

# Verify DATABASE_URL
docker-compose exec backend env | grep DATABASE_URL
```

#### CORS errors
```bash
# Verify CORS_ORIGIN matches frontend URL
docker-compose exec backend env | grep CORS_ORIGIN

# Check backend is accessible
curl http://localhost:3000/health
```

#### Frontend can't connect to backend
```bash
# Verify backend is running
docker-compose ps backend

# Check if API URL is correct (should be built into frontend)
docker-compose exec frontend cat /usr/share/nginx/html/assets/*.js | grep -o 'http://localhost:3000'
```

## Build Images Manually

```bash
# Build backend
docker build -f apps/backend/Dockerfile -t usasset-backend:latest .

# Build frontend with API URL
docker build -f apps/frontend/Dockerfile \
  --build-arg VITE_API_URL=http://localhost:3000 \
  -t usasset-frontend:latest .

# Run manually
docker run -d --name backend \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://dbadmin:localpassword123@host.docker.internal:5432/usasset" \
  -e CORS_ORIGIN="http://localhost:5173" \
  usasset-backend:latest

docker run -d --name frontend \
  -p 5173:80 \
  usasset-frontend:latest
```

## Environment Parity with Azure

This local setup mirrors Azure Container Apps:

| Component | Local | Azure |
|-----------|-------|-------|
| Database | PostgreSQL 15 in Docker | Azure PostgreSQL Flexible Server |
| Backend | Docker Container | Azure Container App |
| Frontend | nginx in Docker | Azure Container App with nginx |
| Secrets | Environment variables | Azure Key Vault |
| Networking | Docker network | Container Apps Environment |
| Health Checks | Docker healthcheck | Container Apps probes |

## Development vs Production

### Development Mode (default)
- Hot reload disabled (use `npm run dev` for hot reload)
- Detailed error messages
- Console logging enabled
- CORS allows localhost

### Production Mode
To test production mode locally:
```bash
# Update docker-compose.yml
# Change NODE_ENV=production
# Add LOG_TO_FILE=true
docker-compose up --build
```

## Security Notes
- Default passwords are for local development only
- Never commit real secrets to version control
- Use Azure Key Vault for production secrets
- Enable SSL/TLS in production

## Next Steps
- Run tests: `docker-compose exec backend npm test`
- Deploy to Azure: Use `utilities/deployment/update-azure.sh`
- Monitor: Check logs with `docker-compose logs -f`