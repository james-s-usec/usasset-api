# Azure Container Apps Deployment Guide - UPDATED

## ⚠️ CRITICAL DISCOVERY (Sep 2, 2025)
**The Dockerfile.production has ALWAYS been broken!**
- Wrong path: `CMD ["node", "dist/src/main.js"]` 
- Correct path: `CMD ["node", "dist/main.js"]`
- NestJS builds to `dist/main.js`, NOT `dist/src/main.js`
- This bug existed since Aug 28, 2025 when file was created

## VERIFIED WORKING DEPLOYMENT PROCESS

### Method 1: Build Locally, Push to ACR (MOST RELIABLE)
```bash
# 1. Fix the Dockerfile.production first!
# Ensure CMD is: CMD ["node", "dist/main.js"]

# 2. Build locally to verify it works
cd /home/james/projects/usasset-api
docker build -f apps/backend/Dockerfile.production -t backend-test:local . --progress=plain

# 3. Test the image locally
docker run --rm --entrypoint sh backend-test:local -c "ls -la dist/main.js"
# Should show: -rw-r--r-- 1 nodejs nodejs 4197 ... dist/main.js

# 4. Login to ACR
az acr login --name usassetacryf2eqktewmxp2

# 5. Tag and push
GIT_COMMIT=$(git rev-parse --short HEAD)
docker tag backend-test:local usassetacryf2eqktewmxp2.azurecr.io/backend:$GIT_COMMIT
docker push usassetacryf2eqktewmxp2.azurecr.io/backend:$GIT_COMMIT

# 6. Deploy to Container Apps
az containerapp update \
  --name usasset-backend \
  --resource-group useng-usasset-api-rg \
  --image usassetacryf2eqktewmxp2.azurecr.io/backend:$GIT_COMMIT \
  --set-env-vars APP_VERSION=$GIT_COMMIT BUILD_TIME=$(date +%Y-%m-%d_%H:%M:%S) \
  --revision-suffix deploy-$GIT_COMMIT
```

### Method 2: ACR Build (ONLY IF DOCKERFILE IS FIXED)
```bash
# ⚠️ WARNING: This takes 3-5 minutes and may timeout in scripts!
# Also REQUIRES the Dockerfile.production to be fixed first

GIT_COMMIT=$(git rev-parse --short HEAD)
BUILD_TIME=$(date +%Y-%m-%d_%H:%M:%S)

# Build in ACR (from project root!)
az acr build --registry usassetacryf2eqktewmxp2 \
  --image backend:$GIT_COMMIT \
  --file apps/backend/Dockerfile.production \
  --build-arg GIT_COMMIT=$GIT_COMMIT \
  --build-arg BUILD_TIME=$BUILD_TIME \
  .

# Deploy
az containerapp update \
  --name usasset-backend \
  --resource-group useng-usasset-api-rg \
  --image usassetacryf2eqktewmxp2.azurecr.io/backend:$GIT_COMMIT \
  --set-env-vars APP_VERSION=$GIT_COMMIT BUILD_TIME=$BUILD_TIME \
  --revision-suffix deploy-$GIT_COMMIT
```

## VERIFICATION - ALWAYS DO THIS!

### Quick Health Check
```bash
# Wait 30 seconds for container to start
sleep 30

# Check health endpoint
curl -s https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/health | jq

# MUST show:
# - "status": "ok"
# - "appVersion": "<your-git-commit>"  # If missing, env vars not set
# - "uptime": <low number>             # If high, you're hitting OLD container!
```

### Full Verification Script
```bash
cd utilities/deployment
./verify-deployment-v2.sh
```

## GUARD RAILS - Things That WILL Break Your Deployment

### 1. Dockerfile Path Issue
**PROBLEM**: `dist/src/main.js` doesn't exist
**SYMPTOM**: Container crashes with "Cannot find module"
**FIX**: Change to `CMD ["node", "dist/main.js"]` in Dockerfile.production

### 2. Revision Already Exists
**PROBLEM**: Trying to deploy same git commit twice
**SYMPTOM**: "revision with suffix deploy-XXX already exists"
**FIX**: Either:
- Use timestamp suffix: `deploy-$GIT_COMMIT-$(date +%s)`
- Or activate existing revision: `az containerapp revision activate`

### 3. ACR Build Timeout
**PROBLEM**: Build takes >2 minutes, script times out
**SYMPTOM**: "Command timed out after 2m"
**FIX**: Build locally and push (Method 1 above)

### 4. Old Container Still Running
**PROBLEM**: Azure keeps old working revision active
**SYMPTOM**: Health endpoint shows high uptime (>300 seconds)
**FIX**: Check which revision has traffic:
```bash
az containerapp revision list -n usasset-backend -g useng-usasset-api-rg \
  --query "[].{Name:name, Active:properties.active, Traffic:properties.trafficWeight}" -o table
```

## FRONTEND DEPLOYMENT

```bash
# Frontend uses regular Dockerfile (not .production)
GIT_COMMIT=$(git rev-parse --short HEAD)

# Build locally first
docker build -f apps/frontend/Dockerfile -t frontend-test:local apps/frontend/

# Push to ACR
docker tag frontend-test:local usassetacryf2eqktewmxp2.azurecr.io/frontend:$GIT_COMMIT
docker push usassetacryf2eqktewmxp2.azurecr.io/frontend:$GIT_COMMIT

# Deploy
az containerapp update \
  --name usasset-frontend \
  --resource-group useng-usasset-api-rg \
  --image usassetacryf2eqktewmxp2.azurecr.io/frontend:$GIT_COMMIT \
  --revision-suffix deploy-$GIT_COMMIT
```

## DEBUGGING COMMANDS

### Check What's Actually Running
```bash
# Backend version check
curl -s https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/health | jq '.data.appVersion'

# Check container logs
az containerapp logs show -n usasset-backend -g useng-usasset-api-rg --tail 50

# Check which revision is active
az containerapp revision list -n usasset-backend -g useng-usasset-api-rg \
  --query "[?properties.active==\`true\`]" -o table
```

### Check ACR Images
```bash
# List available images
az acr repository show-tags --name usassetacryf2eqktewmxp2 --repository backend --orderby time_desc --top 5

# Check build history
az acr task list-runs --registry usassetacryf2eqktewmxp2 --top 5 -o table
```

## CLEANUP OLD REVISIONS

```bash
# List all revisions
az containerapp revision list -n usasset-backend -g useng-usasset-api-rg -o table

# Deactivate old revision
az containerapp revision deactivate -n usasset-backend -g useng-usasset-api-rg \
  --revision <old-revision-name>
```

## ENVIRONMENT VARIABLES REQUIRED

Backend needs these set during deployment:
- `APP_VERSION` - Git commit hash
- `BUILD_TIME` - Build timestamp
- `CORS_ORIGIN` - Frontend URL (auto-set)
- `DATABASE_URL` - From Key Vault (auto-set)

## RESOURCE REFERENCE
- **Resource Group**: useng-usasset-api-rg
- **Backend App**: usasset-backend
- **Frontend App**: usasset-frontend
- **ACR**: usassetacryf2eqktewmxp2
- **Backend URL**: https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io
- **Frontend URL**: https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io

## DEPRECATED APPROACHES

### ❌ DON'T Use revision restart
```bash
# This does NOT pull new images!
az containerapp revision restart  # WRONG - just restarts existing container
```

### ❌ DON'T Trust script timeouts for ACR builds
ACR builds take 3-5 minutes. Script timeouts don't stop the build, they just stop waiting.

### ❌ DON'T Use update-azure.sh without checking
The deployment scripts have hardcoded timeouts that are too short. Build locally instead.

## COMMIT CHECKLIST BEFORE DEPLOYMENT

- [ ] Fixed Dockerfile.production CMD path
- [ ] Committed all changes
- [ ] Ran `npm run ci` successfully
- [ ] Built Docker image locally to test
- [ ] Have git commit hash ready

## IF SOMETHING GOES WRONG

1. **Check logs**: `az containerapp logs show -n usasset-backend -g useng-usasset-api-rg --tail 100`
2. **Check health**: `curl https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/health`
3. **Check uptime**: If >300 seconds, you're on old container
4. **Rollback**: `az containerapp revision activate -n usasset-backend -g useng-usasset-api-rg --revision <previous-working>`

---
*Last Updated: Sep 2, 2025 - After discovering and fixing the dist/src/main.js bug*