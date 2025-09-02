# Azure Deployment Script Usage Guide (v2)

⚡ **Using Production-Hardened v2 Script**

## Quick Start

### Deploy Backend Only
```bash
./utilities/deployment/update-azure-v2.sh
# Select option 1
```

### Deploy Frontend Only
```bash
./utilities/deployment/update-azure-v2.sh
# Select option 2
```

### Deploy Both Applications (Recommended)
```bash
./utilities/deployment/update-azure-v2.sh
# Select option 3
```

### Restart Without Rebuild
```bash
./utilities/deployment/update-azure-v2.sh
# Select option 4
```

### Validate Environment Only
```bash
./utilities/deployment/update-azure-v2.sh
# Select option 5
```

## What The Script Does (v2 Improvements)

### V2 Script Benefits
- ✅ **Fail-fast error handling** - Crashes early with clear messages
- ✅ **Defensive programming** - Validates prerequisites before deployment
- ✅ **Health checks** - Waits for services to be ready after deployment
- ✅ **Modular design** - Uses shared library for maintainability
- ✅ **Comprehensive logging** - Detailed logs for debugging
- ✅ **Version tracking** - Git commit + build time tracking

### Option 1: Backend Only
1. **Validates prerequisites** (Azure CLI, git, resources)
2. **Gets git info** (commit, branch, build time)
3. **Builds Docker image** with version tracking
4. **Sets environment variables**:
   - `APP_VERSION` - Git commit hash
   - `BUILD_TIME` - Current timestamp  
   - `CORS_ORIGIN` - Frontend URL for CORS
5. **Deploys to Container Apps** with health checks
6. **Waits for health** - Ensures backend is ready

### Option 2: Frontend Only  
1. **Validates prerequisites**
2. **Builds Docker image** with `VITE_API_URL` build arg
3. **Deploys to Container Apps** 
4. **Waits for accessibility** - Ensures frontend is ready

### Option 3: Both Applications (Recommended)
1. **Full stack deployment** with dependency management
2. **Deploys backend first** then frontend
3. **Ensures communication** between services
4. **Complete health validation**

### Option 4: Restart Only
1. **No rebuild** - uses existing images
2. **Restarts containers** to apply config changes
3. **Quick option** for environment variable changes

### Option 5: Validate Environment
1. **Checks all prerequisites** without deploying
2. **Validates Azure resources** exist
3. **Tests connectivity** to services
4. **Useful for troubleshooting**

## Important Environment Variables

### Backend
- **DATABASE_URL** - Set via Azure Key Vault (automatic)
- **CORS_ORIGIN** - Set by script to frontend URL
- **APP_VERSION** - Git commit hash
- **BUILD_TIME** - Deployment timestamp

### Frontend
- **VITE_API_URL** - Backend URL (build-time, not runtime!)
  - Must be set during Docker build
  - Baked into JavaScript bundle
  - Cannot be changed after build

## Common Issues & Solutions

### Frontend Not Updating
**Problem**: New code deployed but old version still showing

**Solution**:
```bash
# After deployment, force restart:
az containerapp revision restart -n usasset-frontend -g useng-usasset-api-rg \
  --revision $(az containerapp show -n usasset-frontend -g useng-usasset-api-rg --query "properties.latestRevisionName" -o tsv)
```

### CORS Errors
**Problem**: Frontend can't call backend (CORS blocked)

**Solution**: Backend needs CORS_ORIGIN env var (script handles this automatically)

### Database Connection Issues
**Problem**: Backend can't connect to database

**Solution**: Check DATABASE_URL in Key Vault:
```bash
az keyvault secret show --vault-name usasset-kv-yf2eqktewmxp2 \
  --name database-connection-string --query "value" -o tsv
```

## How to Test After Deployment

### 1. Test Backend
```bash
# Health check
curl https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/health

# Database connection
curl https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/health/db

# Version info
curl https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/version
```

### 2. Test Frontend
```bash
# Open in browser
open https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io

# Check DbStatus component (top-right corner)
# Should show "DB: Ready" in green
```

### 3. Test CORS
```bash
curl -I -X OPTIONS \
  -H "Origin: https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io" \
  -H "Access-Control-Request-Method: GET" \
  https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/health/db \
  2>/dev/null | grep -i "access-control-allow-origin"
```

## Monitoring Deployments

### View Logs
```bash
# Latest deployment log
ls -lt .logs/azure-update_*.log | head -1

# View specific log
cat .logs/azure-update_20250828_123456.log
```

### Check Container Logs
```bash
# Backend logs
az containerapp logs show -n usasset-backend -g useng-usasset-api-rg --tail 50

# Frontend logs
az containerapp logs show -n usasset-frontend -g useng-usasset-api-rg --tail 50
```

### Check Revisions
```bash
# Backend revisions
az containerapp revision list -n usasset-backend -g useng-usasset-api-rg \
  --query "[0:5].{Name:name, Created:properties.createdTime, Active:properties.active}" -o table

# Frontend revisions
az containerapp revision list -n usasset-frontend -g useng-usasset-api-rg \
  --query "[0:5].{Name:name, Created:properties.createdTime, Active:properties.active}" -o table
```

## Script Internals

### File Location
```
utilities/deployment/update-azure.sh
```

### Configuration
```bash
ACR_NAME=usassetacryf2eqktewmxp2
RG_NAME=useng-usasset-api-rg
BACKEND_URL=https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io
FRONTEND_URL=https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io
```

### What Gets Built

#### Backend Dockerfile
- Location: `apps/backend/Dockerfile.production`
- Base: `node:20-alpine`
- Includes: Prisma, migrations, seed data

#### Frontend Dockerfile
- Location: `apps/frontend/Dockerfile`
- Base: `node:20-alpine` (build), `nginx:alpine` (serve)
- Important: Needs `VITE_API_URL` at build time

## Best Practices

1. **Always check logs** after deployment
2. **Test endpoints** to confirm deployment worked
3. **Use option 3** for full stack updates
4. **Check CORS headers** if frontend-backend communication fails
5. **Force restart** if new code doesn't appear

## Rollback Strategy

If something breaks:
```bash
# List recent revisions
az containerapp revision list -n usasset-backend -g useng-usasset-api-rg --query "[0:5].name" -o tsv

# Activate previous revision
az containerapp revision activate -n usasset-backend -g useng-usasset-api-rg \
  --revision PREVIOUS_REVISION_NAME
```

## Required Azure Permissions
- Container Apps Contributor
- ACR Push permissions
- Key Vault Reader (for secrets)

## Prerequisites
- Azure CLI installed and logged in
- Git repository with latest code
- Access to resource group `useng-usasset-api-rg`

## Support
Check logs first: `.logs/azure-update_*.log`
Then check container logs in Azure Portal or CLI