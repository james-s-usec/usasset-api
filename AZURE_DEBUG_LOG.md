# Azure Deployment Debug Log

## Date: 2025-08-28

## Issue: Backend not updating with new code

### Problem Summary
- Built new backend image with version endpoint at `/version`
- Image builds successfully in Azure Container Registry (ACR)
- Container App is NOT pulling the new image
- Still running old revision from Aug 27

### Current Status

#### What's Deployed
- **Active Revision**: `usasset-backend--e0e677a` (just created)
- **Previous Revision**: `usasset-backend--dtzq7kr` (Aug 27, 22:22 UTC)  
- **Image**: `usassetacryf2eqktewmxp2.azurecr.io/backend:latest`
- **URL**: https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io

#### Endpoints Status
- `/` - Returns "Hello World!" (old code)
- `/version` - Returns 404 (new endpoint not available)
- `/health` - Returns 404 (should exist)

### Build Issues Encountered & Fixed

#### 1. Monorepo Build Context
**Error**: `COPY apps/backend/package*.json ./apps/backend/` - no source files
**Cause**: Azure was building from `/apps/backend/` instead of root
**Fix**: Updated deployment script to build from monorepo root with correct Dockerfile path
```bash
az acr build --registry $ACR_NAME --image backend:latest \
  --file /home/james/projects/usasset-api/apps/backend/Dockerfile.production \
  /home/james/projects/usasset-api/
```

#### 2. Missing Logs Module
**Error**: `Cannot find module './logs/logs.module'`
**Cause**: `/logs` was in `.gitignore` (backend/.gitignore had `logs` which matched `src/logs`)
**Fix**: Changed backend/.gitignore from `logs` to `/logs` to only ignore root logs folder

#### 3. Dockerignore Blocking Files
**Error**: Build couldn't find logs module even after git fix
**Cause**: `.dockerignore` had `**/logs` which excluded ALL logs directories
**Fix**: Changed from `**/logs` to `logs/` to only exclude root logs

#### 4. User/Group Already Exists
**Error**: `addgroup: gid '1000' in use`
**Cause**: Node alpine image already has GID 1000
**Fix**: Changed to GID/UID 1001 and added existence checks
```dockerfile
RUN (getent group nodejs || addgroup -g 1001 -S nodejs) && \
    (id -u nodejs 2>/dev/null || adduser -S nodejs -u 1001 -G nodejs)
```

#### 5. Container App Not Pulling New Image
**Issue**: Even after successful build, Container App uses old image
**Cause**: `az containerapp revision restart` doesn't pull new images, just restarts existing
**Fix**: Must use `az containerapp update` with explicit image tag to force new deployment

### Container Logs Error - FULLY RESOLVED ✅
```
getaddrinfo for host "postgres" port 5432: Name does not resolve
```
**Root Cause**: 
- The `docker-entrypoint.sh` script uses `${DB_HOST:-postgres}` which defaults to "postgres" when DB_HOST isn't set
- Azure only provides DATABASE_URL, not separate DB_HOST/DB_PORT variables
- The script was stuck in an infinite loop trying to connect to non-existent "postgres" hostname

**Investigation Steps**:
1. Checked container logs - found repeated DNS resolution failures
2. Reviewed docker-entrypoint.sh - found it expects DB_HOST variable
3. Listed env vars in Container App - only DATABASE_URL exists, no DB_HOST
4. Checked Key Vault - DATABASE_URL points to correct Azure PostgreSQL

**Solution (2 parts)**: 

1. Modified `docker-entrypoint.sh` to parse DATABASE_URL and extract host/port:
```bash
# Parse DATABASE_URL to extract host and port
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\)/.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*@[^:]*:\([0-9]*\)/.*|\1|p')
```

2. **CRITICAL**: Fixed DATABASE_URL in Key Vault - password had special characters (`/` and `=`) that needed URL encoding:
```bash
# Original password: 12dap8RApQWxLp0kFUGP/xZbSEzYaKBKu/Y9taiPGAw=
# URL-encoded: 12dap8RApQWxLp0kFUGP%2FxZbSEzYaKBKu%2FY9taiPGAw%3D
DATABASE_URL="postgresql://dbadmin:12dap8RApQWxLp0kFUGP%2FxZbSEzYaKBKu%2FY9taiPGAw%3D@usasset-db-yf2eqktewmxp2-v2.postgres.database.azure.com:5432/usasset?sslmode=require"

# Update Key Vault
az keyvault secret set --vault-name usasset-kv-yf2eqktewmxp2 --name database-connection-string --value "$DATABASE_URL"

# Update Container App secret
az containerapp secret set -n usasset-backend -g useng-usasset-api-rg --secrets "database-url=$DATABASE_URL"

# Restart container
az containerapp revision restart -n usasset-backend -g useng-usasset-api-rg --revision usasset-backend--fix-e0e677a
```

### Deployment Commands That Work

#### Build Image in ACR
```bash
GIT_COMMIT=$(git rev-parse --short HEAD)
BUILD_TIME=$(date +%Y-%m-%d_%H:%M:%S)

az acr build --registry usassetacryf2eqktewmxp2 \
  --image backend:latest \
  --file /home/james/projects/usasset-api/apps/backend/Dockerfile.production \
  /home/james/projects/usasset-api/
```

#### Force Update Container App  
```bash
az containerapp update \
  --name usasset-backend \
  --resource-group useng-usasset-api-rg \
  --image usassetacryf2eqktewmxp2.azurecr.io/backend:latest \
  --revision-suffix "$GIT_COMMIT" \
  --set-env-vars APP_VERSION=$GIT_COMMIT GIT_COMMIT=$GIT_COMMIT BUILD_TIME=$(date -Iseconds)
```

### Check Commands

#### View Revisions
```bash
az containerapp revision list \
  --name usasset-backend \
  --resource-group useng-usasset-api-rg \
  --query "[0:5].{Name:name, Created:properties.createdTime, Active:properties.active}" \
  -o table
```

#### View Logs
```bash
az containerapp logs show \
  -n usasset-backend \
  -g useng-usasset-api-rg \
  --tail 50
```

#### Test Endpoints
```bash
# Root
curl https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/

# Version (new endpoint)
curl https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/version

# Health
curl https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/health
```

### Files Modified

1. `/home/james/projects/usasset-api/utilities/deployment/update-azure.sh`
   - Fixed paths from `/home/swansonj/` to `/home/james/`
   - Added `--file` parameter to specify Dockerfile
   - Changed build context from `/apps/backend/` to monorepo root
   - Added revision parameter to restart command

2. `/home/james/projects/usasset-api/apps/backend/.gitignore`
   - Changed `logs` to `/logs` to not ignore `src/logs`

3. `/home/james/projects/usasset-api/.dockerignore`
   - Changed `**/logs` to `logs/` to not exclude source code logs

4. `/home/james/projects/usasset-api/apps/backend/Dockerfile.production`
   - Fixed user/group creation to use UID/GID 1001
   - Removed duplicate COPY for backend node_modules (workspaces only have root)
   - Removed unnecessary prisma install in production stage

5. `/home/james/projects/usasset-api/apps/backend/src/app.controller.ts`
   - Added version endpoint returning version, build time, git commit

### Managed Identity Setup for Key Vault Access

**Current Issue**: Container App can't use Key Vault references with managed identity
```
ERROR: Managed Identity not enabled, cannot reference secret database-url from Azure Key Vault
```

**Setup Steps**:
```bash
# 1. Enable managed identity on Container App
az containerapp identity assign \
  -n usasset-backend \
  -g useng-usasset-api-rg \
  --user-assigned /subscriptions/{subscription-id}/resourceGroups/useng-usasset-api-rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/usasset-identity-yf2eqktewmxp2

# 2. Grant Key Vault access to managed identity
az keyvault set-policy \
  --name usasset-kv-yf2eqktewmxp2 \
  --object-id $(az identity show -n usasset-identity-yf2eqktewmxp2 -g useng-usasset-api-rg --query principalId -o tsv) \
  --secret-permissions get list

# 3. Update secrets to use Key Vault references
az containerapp secret set \
  -n usasset-backend \
  -g useng-usasset-api-rg \
  --secrets database-url=keyvaultref:https://usasset-kv-yf2eqktewmxp2.vault.azure.net/secrets/database-connection-string,identityref:/subscriptions/{subscription-id}/resourceGroups/useng-usasset-api-rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/usasset-identity-yf2eqktewmxp2
```

### Next Steps

1. **Deploy Fixed docker-entrypoint.sh**: Build and deploy new image with DATABASE_URL parsing
2. **Enable Managed Identity**: Follow steps above for secure Key Vault access
3. **Verify New Code**: Check if version endpoint works after deployment
4. **Update Deployment Script**: Fix to use `update` instead of `revision restart`

### Environment Variables Set
```json
{
  "APP_VERSION": "e0e677a",
  "GIT_COMMIT": "e0e677a", 
  "BUILD_TIME": "2025-08-28T00:21:57-06:00",
  "DATABASE_URL": "[secretRef: database-url]"
}
```

### Final Status - WORKING E2E ✅

#### Test Results (2025-08-28 13:06 UTC)
```bash
# Root endpoint
curl https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/
{"success":true,"data":"Hello World!",...}

# Version endpoint (NEW - previously 404)
curl https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/version
{"success":true,"data":{"version":"e0e677a","buildTime":"2025-08-28T07:01:39-06:00","gitCommit":"e0e677a",...}}

# Health endpoint (NOW WORKING)
curl https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/health
{"success":true,"data":{"status":"ok",...}}

# Database health (CONNECTED)
curl https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/health/db
{"success":true,"data":{"status":"connected",...}}
```

✅ Image builds successfully in ACR  
✅ New revision deployed with correct code
✅ Application running with all endpoints
✅ Database connection working
✅ Prisma migrations applied (including log_entries table)
✅ Logging to database working (log_entries table created and functional)