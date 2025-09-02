# USAsset Deployment - Standard Operating Procedure (SOP)

**THIS IS THE ONLY DEPLOYMENT GUIDE YOU NEED**

## ⚠️ CRITICAL BUG FIX REQUIRED FIRST
```bash
# Check if Dockerfile.production is fixed:
grep "CMD.*main.js" apps/backend/Dockerfile.production

# If it shows: CMD ["node", "dist/src/main.js"] - WRONG!
# Fix it to:   CMD ["node", "dist/main.js"]
```

## DEPLOYMENT COMMANDS - COPY & PASTE

### Option 1: Deploy Everything (Backend + Frontend)
```bash
# From project root
cd /home/james/projects/usasset-api

# 1. Commit your changes
git add -A && git commit -m "your message"

# 2. Build backend locally
docker build -f apps/backend/Dockerfile.production -t backend:local .

# 3. Build frontend locally (NOTE: use root context!)
docker build -f apps/frontend/Dockerfile \
  --build-arg VITE_APP_VERSION=$GIT_COMMIT \
  --build-arg VITE_BUILD_TIME=$(date +%Y-%m-%d_%H:%M:%S) \
  --build-arg VITE_API_URL=https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io \
  -t frontend:local .

# 4. Login to Azure
az acr login --name usassetacryf2eqktewmxp2

# 5. Tag and push
GIT_COMMIT=$(git rev-parse --short HEAD)
docker tag backend:local usassetacryf2eqktewmxp2.azurecr.io/backend:$GIT_COMMIT
docker tag frontend:local usassetacryf2eqktewmxp2.azurecr.io/frontend:$GIT_COMMIT
docker push usassetacryf2eqktewmxp2.azurecr.io/backend:$GIT_COMMIT
docker push usassetacryf2eqktewmxp2.azurecr.io/frontend:$GIT_COMMIT

# 6. Deploy to Azure
az containerapp update \
  --name usasset-backend \
  --resource-group useng-usasset-api-rg \
  --image usassetacryf2eqktewmxp2.azurecr.io/backend:$GIT_COMMIT \
  --set-env-vars APP_VERSION=$GIT_COMMIT BUILD_TIME=$(date +%Y-%m-%d_%H:%M:%S) \
  --revision-suffix deploy-$GIT_COMMIT

az containerapp update \
  --name usasset-frontend \
  --resource-group useng-usasset-api-rg \
  --image usassetacryf2eqktewmxp2.azurecr.io/frontend:$GIT_COMMIT \
  --revision-suffix deploy-$GIT_COMMIT

# 7. Verify (ALWAYS DO THIS!)
sleep 30
curl -s https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/health | jq
# Check: appVersion should match your commit
# Check: uptime should be < 60 seconds
```

### Option 2: Backend Only
```bash
GIT_COMMIT=$(git rev-parse --short HEAD)
docker build -f apps/backend/Dockerfile.production -t backend:local .
docker tag backend:local usassetacryf2eqktewmxp2.azurecr.io/backend:$GIT_COMMIT
docker push usassetacryf2eqktewmxp2.azurecr.io/backend:$GIT_COMMIT
az containerapp update \
  --name usasset-backend \
  --resource-group useng-usasset-api-rg \
  --image usassetacryf2eqktewmxp2.azurecr.io/backend:$GIT_COMMIT \
  --set-env-vars APP_VERSION=$GIT_COMMIT BUILD_TIME=$(date +%Y-%m-%d_%H:%M:%S) \
  --revision-suffix deploy-$GIT_COMMIT-$(date +%s)
```

### Option 3: Frontend Only (WITH VERSION DISPLAY)
```bash
GIT_COMMIT=$(git rev-parse --short HEAD)
BUILD_TIME=$(date +%Y-%m-%d_%H:%M:%S)

# Build with version info (shows in footer)
docker build -f apps/frontend/Dockerfile \
  --build-arg VITE_APP_VERSION=$GIT_COMMIT \
  --build-arg VITE_BUILD_TIME=$BUILD_TIME \
  --build-arg VITE_API_URL=https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io \
  -t frontend:local .

docker tag frontend:local usassetacryf2eqktewmxp2.azurecr.io/frontend:$GIT_COMMIT
docker push usassetacryf2eqktewmxp2.azurecr.io/frontend:$GIT_COMMIT

az containerapp update \
  --name usasset-frontend \
  --resource-group useng-usasset-api-rg \
  --image usassetacryf2eqktewmxp2.azurecr.io/frontend:$GIT_COMMIT \
  --revision-suffix deploy-$GIT_COMMIT-$(date +%s)
```

## VERIFICATION CHECKLIST

```bash
# Backend health with version
curl -s https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/health | jq '.data.appVersion'

# Frontend - CHECK THE FOOTER!
# Open https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io/
# Look at bottom of page - should show: "Version: <commit> | Built: <timestamp>"

# Check active revisions
az containerapp revision list -n usasset-backend -g useng-usasset-api-rg --query "[?properties.active==\`true\`].name" -o tsv
```

## IF SOMETHING BREAKS

### Container won't start
```bash
# Check logs
az containerapp logs show -n usasset-backend -g useng-usasset-api-rg --tail 100
# Look for: "Cannot find module" = Dockerfile path wrong
```

### Old version still running
```bash
# Check uptime in health endpoint
# If > 300 seconds, you're hitting old container
# Solution: Add timestamp to revision suffix
```

### Rollback
```bash
# Find previous working revision
az containerapp revision list -n usasset-backend -g useng-usasset-api-rg -o table

# Activate it
az containerapp revision activate -n usasset-backend -g useng-usasset-api-rg --revision <previous-revision>
```

## STOP USING THESE
- ❌ `update-azure.sh` - timeouts too short
- ❌ `update-azure-v2.sh` - still has timeout issues  
- ❌ `az containerapp revision restart` - doesn't pull new images
- ❌ ACR builds via scripts - they timeout, build locally instead

## RESOURCE NAMES (DON'T GUESS)
- Resource Group: `useng-usasset-api-rg`
- Backend: `usasset-backend`
- Frontend: `usasset-frontend`
- Registry: `usassetacryf2eqktewmxp2`
- Backend URL: `https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io`
- Frontend URL: `https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io`

---
**Last Updated**: Sep 2, 2025
**Status**: WORKING (Backend verified with 7b4411e)
**Rule**: Build locally, push to ACR, deploy. Always verify.