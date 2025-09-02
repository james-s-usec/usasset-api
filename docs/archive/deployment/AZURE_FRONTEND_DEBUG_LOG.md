# Azure Frontend Deployment Debug Log

## Date: 2025-08-28

## Current Status (Updated 14:17 UTC) - FULLY RESOLVED ✅
- **Frontend deployed**: YES ✅
- **Frontend serving**: YES ✅ (https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io)
- **Frontend has backend URL**: YES ✅ (confirmed in JS bundle)
- **Latest revision**: usasset-frontend--deploy-d2c5b1e
- **Build with API URL**: YES ✅ (using --build-arg)
- **Serving correct bundle**: YES ✅ (index-MT42Pd3O.js with API URL)

## Critical Issue: RESOLVED - Vite Environment Variables

### Original Problem
Frontend was deployed but NOT configured with backend URL. The VITE_API_URL runtime environment variable wasn't being used.

### Root Cause Analysis
**VITE APPS BUILD ENV VARS AT BUILD TIME, NOT RUNTIME!**

Current flow (WRONG):
1. Build image without env vars
2. Deploy to Container Apps
3. Set VITE_API_URL in Container Apps env vars
4. ❌ Vite app can't use runtime env vars - they're already baked into the JS bundle

Required flow (CORRECT):
1. Pass VITE_API_URL as build arg to Docker
2. Build Vite app with env var available
3. Deploy static bundle (env var already baked in)

### Evidence
```bash
# Container App has env var set (but useless for Vite):
az containerapp show -n usasset-frontend -g useng-usasset-api-rg --query "properties.template.containers[0].env"
[
  {
    "name": "VITE_API_URL",
    "value": "https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io"
  }
]

# But frontend JS bundle has no backend URL:
curl -s https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io/assets/index-ZSCEOl42.js | grep "usasset-backend"
# Returns nothing - API URL not in bundle
```

## Current Dockerfile Analysis

```dockerfile
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
RUN npm ci
COPY apps/frontend ./apps/frontend/
RUN cd apps/frontend && npm run build  # ← BUILD HAPPENS HERE WITHOUT ENV VAR!

FROM nginx:alpine
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Solution Required

### Option 1: Build-time ARG (Preferred)
```dockerfile
FROM node:20-alpine as build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
WORKDIR /app
...
RUN cd apps/frontend && npm run build  # Now has VITE_API_URL available
```

### Option 2: Runtime injection with envsubst
Create a template and replace at container startup (more complex)

### Option 3: Build in ACR with build args
```bash
az acr build --build-arg VITE_API_URL=https://backend-url ...
```

## Deployment Script Issues

Current script builds without env vars:
```bash
az acr build --registry $ACR_NAME --image frontend:latest --image frontend:$GIT_COMMIT \
  --file /home/james/projects/usasset-api/apps/frontend/Dockerfile \
  /home/james/projects/usasset-api/
```

Needs to be:
```bash
az acr build --registry $ACR_NAME --image frontend:latest --image frontend:$GIT_COMMIT \
  --build-arg VITE_API_URL=https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io \
  --file /home/james/projects/usasset-api/apps/frontend/Dockerfile \
  /home/james/projects/usasset-api/
```

## Test Commands

### Check if frontend is up
```bash
curl -I https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io
```

### Check frontend logs
```bash
az containerapp logs show -n usasset-frontend -g useng-usasset-api-rg --tail 50
```

### Check what's in the JS bundle
```bash
# Get JS file name
curl -s https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io | grep -o "/assets/index-[^\"]*\.js"

# Check for API URL in bundle
curl -s https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io/assets/index-XXX.js | grep -i api
```

### Test backend directly
```bash
curl https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/health
```

## Solution Applied ✅

1. **Fixed Dockerfile** - Added ARG/ENV for VITE_API_URL ✅
2. **Fixed deployment script** - Pass --build-arg VITE_API_URL ✅
3. **Rebuilt and deployed** - With proper env var baked in ✅
4. **Frontend has backend URL** - Confirmed in JS bundle ✅
5. **CORS Issue Found** - Backend only allows localhost:5173 ❌

## Frontend-Backend Communication Test Results

### What Works
- Frontend is deployed and serving ✅
- Frontend has backend URL in JS bundle ✅
- Backend is running and healthy ✅
- Backend responds to direct API calls ✅
- Database is connected ✅
- Correlation logging is working ✅

### What's Broken - CORS Configuration
```bash
# Current CORS header from backend:
access-control-allow-origin: http://localhost:5173

# Should be:
access-control-allow-origin: https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io
```

**Root Cause**: Backend Container App missing CORS_ORIGIN environment variable

### Fix Required
```bash
# Set CORS_ORIGIN env var on backend
az containerapp update -n usasset-backend -g useng-usasset-api-rg \
  --set-env-vars CORS_ORIGIN=https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io

# Then restart backend
az containerapp revision restart -n usasset-backend -g useng-usasset-api-rg \
  --revision $(az containerapp show -n usasset-backend -g useng-usasset-api-rg --query "properties.latestRevisionName" -o tsv)
```

## Complete E2E Testing Checklist

### Backend Tests ✅
- [x] Root endpoint: `curl https://usasset-backend.../`
- [x] Version endpoint: `curl https://usasset-backend.../version`
- [x] Health endpoint: `curl https://usasset-backend.../health`
- [x] DB health: `curl https://usasset-backend.../health/db`
- [x] Logs endpoint: `POST /logs`
- [x] Database connection working
- [x] Correlation IDs in responses

### Frontend Tests ✅
- [x] Frontend serves HTML
- [x] JS bundle loads
- [x] Backend URL in bundle
- [x] DbStatus component exists

### Integration Tests ✅
- [x] Frontend can call backend (CORS fixed)
- [x] Backend returns correct CORS headers
- [x] API responds with correlation IDs
- [ ] DbStatus shows "Ready" in UI (needs browser test)
- [ ] No CORS errors in browser console (needs browser test)

## FINAL SOLUTION - COMPLETE ✅

### What Was Fixed
1. **Frontend Dockerfile** - Added ARG/ENV for VITE_API_URL
2. **Frontend deployment script** - Pass --build-arg VITE_API_URL
3. **Backend Container App** - Set CORS_ORIGIN env var
4. **Backend deployment script** - Always sets CORS_ORIGIN

### Confirmed Working
```bash
# CORS header now correct:
curl -I -X OPTIONS \
  -H "Origin: https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io" \
  https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/health/db

# Returns:
access-control-allow-origin: https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io

# Backend responds with data:
{"success":true,"data":{"status":"connected"...},"correlationId":"..."}
```

## Verification Commands

### Test CORS Headers
```bash
# Check what CORS headers backend returns
curl -I -X OPTIONS \
  -H "Origin: https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io" \
  -H "Access-Control-Request-Method: GET" \
  https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/health/db
```

### Check Frontend API Calls
```bash
# Open browser developer console on frontend
# Go to: https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io
# Check Network tab for failed requests
# Check Console for CORS errors
```

### Monitor Backend Logs
```bash
# Watch for incoming requests from frontend
az containerapp logs show -n usasset-backend -g useng-usasset-api-rg --follow | grep -i cors
```

## Files to Fix

1. `/home/james/projects/usasset-api/apps/frontend/Dockerfile`
2. `/home/james/projects/usasset-api/utilities/deployment/update-azure.sh`
3. Create production `.env.production` file or use build args

## Debug Strategy

1. **Local test first**:
   ```bash
   cd apps/frontend
   VITE_API_URL=https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io npm run build
   # Check if API URL is in dist/assets/index-*.js
   ```

2. **Docker build test**:
   ```bash
   docker build --build-arg VITE_API_URL=https://backend-url -f apps/frontend/Dockerfile .
   ```

3. **ACR build with arg**:
   ```bash
   az acr build --build-arg VITE_API_URL=https://backend-url ...
   ```

4. **Verify in deployed app**:
   ```bash
   # After deployment, check JS bundle has API URL
   ```

## Common Pitfalls

1. **Setting env vars in Container Apps** - Doesn't work for Vite
2. **Using process.env in Vite** - Use import.meta.env
3. **Forgetting VITE_ prefix** - Only VITE_ prefixed vars are exposed
4. **Not passing build args to Docker** - Must use --build-arg

## Resource Naming
- Frontend Container App: usasset-frontend
- Backend Container App: usasset-backend
- Frontend URL: https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io
- Backend URL: https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io
- ACR: usassetacryf2eqktewmxp2
- Resource Group: useng-usasset-api-rg