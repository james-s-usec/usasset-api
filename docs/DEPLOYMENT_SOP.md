# USAsset Deployment - Standard Operating Procedure (SOP)

**THIS IS THE ONLY DEPLOYMENT GUIDE YOU NEED**  
**Last Updated:** 2025-09-02  
**Version:** 2.0

## 🚨 KNOWN ISSUES & FIXES

### Issue #1: Backend Dockerfile Bug (FIXED)
- **Problem:** CMD pointed to wrong path `dist/src/main.js` instead of `dist/main.js`
- **Impact:** All deployments failed since Aug 28
- **Fix:** Already fixed in repository
- **Verify:** `grep "CMD.*main.js" apps/backend/Dockerfile.production`
- **Should show:** `CMD ["node", "dist/main.js"]`

### Issue #2: ACR Name Confusion
- **Problem:** Multiple ACR names referenced in old docs
- **Correct ACR:** `usassetacryf2eqktewmxp2.azurecr.io`
- **Wrong Names:** `usassetregistry`, `registry`, etc.
- **Always verify:** `az acr list --query "[].name" -o tsv`

### Issue #3: Frontend Version Not Showing
- **Problem:** Version footer doesn't display without proper build args
- **Solution:** Must pass VITE_APP_VERSION and VITE_BUILD_TIME during build
- **Also:** Must include VITE_API_URL for backend connectivity

### Issue #4: Lint Error - Function Too Long
- **Problem:** AppContent function exceeded 30 line limit
- **Solution:** Extract components (like VersionFooter) into separate functions

### Issue #5: Resource Group Name
- **Correct RG:** `useng-usasset-api-rg`
- **Wrong RG:** `USAssetRG` (doesn't exist)

## 📋 PRE-DEPLOYMENT CHECKLIST

1. **Verify Azure Login**
   ```bash
   az account show
   # Should show your Azure subscription
   ```

2. **Verify ACR Access**
   ```bash
   az acr list --query "[].name" -o tsv
   # Should show: usassetacryf2eqktewmxp2
   ```

3. **Check Current Git Status**
   ```bash
   git status
   # Commit any changes before deploying
   ```

4. **Run Full Quality Checks**
   ```bash
   npm run ci
   # Runs lint + typecheck + tests + build for all workspaces
   # Fix any errors before deploying
   ```

## 🗄️ DATABASE CONFIGURATION & SEEDING

### Production Database Seeding Setup

The backend Docker container includes automatic database seeding for production deployments. This creates essential system data including:

- **Default Users**: Admin, Super Admin, and Regular User accounts
- **Default Folders**: 9 pre-configured folders (Calculations, Controls, Cost Estimates, Drawings, Field, For Encore, Issues Log, Photos, Submittals)
- **Asset Column Aliases**: 143+ mappings for CSV import compatibility

### Enabling Seeding in Production

Database seeding is controlled by the `RUN_SEED` environment variable in your Container App configuration:

```bash
# Enable seeding during deployment
az containerapp update \
  --name usasset-backend \
  --resource-group useng-usasset-api-rg \
  --set-env-vars RUN_SEED=true

# Disable seeding (default behavior)
az containerapp update \
  --name usasset-backend \
  --resource-group useng-usasset-api-rg \
  --set-env-vars RUN_SEED=false
```

### Seeding Behavior

- **Idempotent**: Safe to run multiple times - uses `upsert` operations
- **Non-destructive**: Won't overwrite existing data
- **Fast**: Typically completes in 1-2 seconds
- **Logged**: All seeding operations logged with ✅ success indicators

### When to Enable Seeding

✅ **Enable seeding when:**
- First-time production deployment
- After database reset or recreation  
- Adding new system folders or users
- Migrating to new environment

❌ **Disable seeding when:**
- Regular code deployments
- Database already has data
- Performance-critical deployments

### Verifying Seeding Results

Check seeding success through Container App logs:
```bash
# View seeding logs
az containerapp logs show \
  --name usasset-backend \
  --resource-group useng-usasset-api-rg \
  --follow

# Look for these success messages:
# ✅ Seeded users: { admin, superAdmin, user }
# ✅ Seeded folders: Calculations, Controls, Cost Estimates...
# ✅ Seeded asset column aliases: 143
# 🌱 Database seeding completed!
```

### Default Seeded Data

**Users Created:**
- `admin@usasset.com` (Admin role)
- `superadmin@usasset.com` (Super Admin role)
- `user@usasset.com` (Regular User role)

**Folders Created:**
- Calculations (Blue #2196F3)
- Controls (Orange #FF9800)
- Cost Estimates (Green #4CAF50)
- Drawings (Purple #9C27B0)
- Field (Blue Grey #607D8B)
- For Encore (Pink #E91E63)
- Issues Log (Red #F44336)
- Photos (Cyan #00BCD4)
- Submittals (Light Green #8BC34A)

### Troubleshooting Seeding Issues

**Seeding fails with "User already exists":**
- This is normal - seeding uses `upsert` and will show this message but continue
- Check logs for final "✅ Database seeding completed!" message

**Seeding takes too long:**
- Normal duration is 1-2 seconds
- If > 10 seconds, check database connection string in Key Vault
- Verify `DATABASE_URL` secret is properly configured

**Folders not appearing in frontend:**
- Ensure seeding completed successfully (check logs)
- Folders marked as `is_default: true` for system identification
- Frontend fetches folders from `/api/folders` endpoint

## 🚀 STEP-BY-STEP DEPLOYMENT GUIDE

### Frontend Deployment (Detailed Steps)

1. **Run full quality checks first**
   ```bash
   npm run ci
   # Runs lint + typecheck + tests + build
   # Fix any errors before proceeding
   ```

2. **Get current commit hash**
   ```bash
   GIT_COMMIT=$(git rev-parse --short HEAD)
   echo "Deploying version: $GIT_COMMIT"
   ```

3. **Build frontend Docker image WITH version info**
   ```bash
   docker build -f apps/frontend/Dockerfile \
     --build-arg VITE_APP_VERSION=$GIT_COMMIT \
     --build-arg VITE_BUILD_TIME="$(date -Iseconds)" \
     --build-arg VITE_API_URL=https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io \
     -t frontend:$GIT_COMMIT .
   ```
   **IMPORTANT:** 
   - Must use root context (`.` at end)
   - All three build args are required
   - VITE_API_URL must point to backend Azure URL

4. **Login to ACR**
   ```bash
   az acr login --name usassetacryf2eqktewmxp2
   # Should say "Login Succeeded"
   ```

5. **Tag for ACR**
   ```bash
   docker tag frontend:$GIT_COMMIT \
     usassetacryf2eqktewmxp2.azurecr.io/usasset-frontend:$GIT_COMMIT
   ```

6. **Push to ACR**
   ```bash
   docker push usassetacryf2eqktewmxp2.azurecr.io/usasset-frontend:$GIT_COMMIT
   ```

7. **Deploy to Azure Container Apps**
   ```bash
   az containerapp update \
     --name usasset-frontend \
     --resource-group useng-usasset-api-rg \
     --image usassetacryf2eqktewmxp2.azurecr.io/usasset-frontend:$GIT_COMMIT \
     --revision-suffix deploy-$GIT_COMMIT
   ```

8. **Verify deployment**
   ```bash
   # Wait 30 seconds for deployment
   sleep 30
   
   # CRITICAL: Open in browser and scroll to bottom
   echo "🌐 Open: https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io"
   echo "📍 Scroll to bottom - footer should show:"
   echo "   Version: $GIT_COMMIT | Built: [timestamp]"
   echo ""
   echo "❌ If footer shows 'Version: dev | Built: unknown' - BUILD FAILED"
   echo "✅ If footer shows correct commit hash - BUILD SUCCEEDED"
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
  --build-arg VITE_BUILD_TIME="$(date -Iseconds)" \
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

## 🆕 AZURE STORAGE & FILE UPLOAD CONFIGURATION (CRITICAL)

### Prerequisites for File Upload Feature
1. **Azure Storage Account**: `usassetstoragedev` (already created)
2. **Container**: `uploads` (already created)
3. **Key Vault Secret**: Must be added for production

### Step 1: Add Storage Connection String to Key Vault
```bash
# Add the storage connection string to Key Vault
az keyvault secret set \
  --vault-name usasset-kv-yf2eqktewmxp2 \
  --name azure-storage-connection-string \
  --value "DefaultEndpointsProtocol=https;EndpointSuffix=core.windows.net;AccountName=usassetstoragedev;AccountKey=<YOUR-KEY>"
```

### Step 2: Add Secret to Container App
```bash
# Add secret to backend Container App (MUST DO THIS FIRST!)
az containerapp secret set \
  --name usasset-backend \
  --resource-group useng-usasset-api-rg \
  --secrets azure-storage-connection-string="<CONNECTION-STRING>" \
  --output none
```

### Step 3: Deploy Backend with Storage Configuration
```bash
# Deploy with storage environment variables
az containerapp update \
  --name usasset-backend \
  --resource-group useng-usasset-api-rg \
  --image usassetacryf2eqktewmxp2.azurecr.io/backend:$GIT_COMMIT \
  --set-env-vars \
    APP_VERSION=$GIT_COMMIT \
    BUILD_TIME=$(date +%Y-%m-%d_%H:%M:%S) \
    AZURE_STORAGE_CONNECTION_STRING=secretref:azure-storage-connection-string \
    AZURE_STORAGE_CONTAINER_NAME=uploads \
    CORS_ORIGIN="https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io" \
  --revision-suffix deploy-$GIT_COMMIT-storage
```

### ⚠️ CRITICAL: CORS Configuration

**MUST UPDATE CORS AFTER FRONTEND DEPLOYMENT!**
The backend needs to allow the frontend URL for CORS:

```bash
# Update backend CORS to allow frontend
az containerapp update \
  --name usasset-backend \
  --resource-group useng-usasset-api-rg \
  --set-env-vars CORS_ORIGIN="https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io" \
  --output none
```

**How CORS Works in This App:**
- Backend reads `CORS_ORIGIN` environment variable
- If set: Uses that value (production)
- If not set: Defaults to localhost:5173,5174,5175 (development)
- Code location: `apps/backend/src/main.ts` lines 13-24

### Frontend API URL Configuration

**CRITICAL**: Frontend must be built with backend URL:
```bash
# When building frontend Docker image
docker build -f apps/frontend/Dockerfile \
  --build-arg VITE_APP_VERSION=$GIT_COMMIT \
  --build-arg VITE_BUILD_TIME="$(date -Iseconds)" \
  --build-arg VITE_API_URL=https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io \
  -t frontend:$GIT_COMMIT .
```

**File Upload API Calls:**
- Frontend uses `config.api.baseUrl` from `src/config/index.ts`
- File operations in `src/components/file-management/useFileOperations.ts`
- MUST use full backend URL, not relative paths!

### Complete Deployment Checklist for File Upload

- [ ] Storage account exists: `usassetstoragedev`
- [ ] Container exists: `uploads`
- [ ] Connection string in Key Vault: `azure-storage-connection-string`
- [ ] Secret added to Container App: `azure-storage-connection-string`
- [ ] Backend deployed with `AZURE_STORAGE_CONNECTION_STRING=secretref:...`
- [ ] Backend deployed with `AZURE_STORAGE_CONTAINER_NAME=uploads`
- [ ] Frontend built with `VITE_API_URL=https://backend-url...`
- [ ] Backend CORS updated with frontend URL
- [ ] Test file upload at `/files` page

### Testing File Upload in Production
```bash
# Test backend directly
curl -X POST https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/api/files \
  -F "file=@test.csv" \
  -H "Accept: application/json" | jq

# List files
curl https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/api/files | jq

# Test from frontend
# Navigate to: https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io/files
```

## 🔧 TROUBLESHOOTING GUIDE

### Frontend Version Not Showing
**Symptom:** Footer shows "Version: dev | Built: unknown"
**Cause:** Build args not passed correctly
**Fix:**
```bash
# Must include all three build args:
docker build -f apps/frontend/Dockerfile \
  --build-arg VITE_APP_VERSION=$GIT_COMMIT \
  --build-arg VITE_BUILD_TIME="$(date -Iseconds)" \
  --build-arg VITE_API_URL=https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io \
  -t frontend:$GIT_COMMIT .
```

### ACR Login Fails
**Symptom:** "Could not connect to registry"
**Fix:**
```bash
# Find correct ACR name
az acr list --query "[].name" -o tsv
# Use that name (usassetacryf2eqktewmxp2)
az acr login --name usassetacryf2eqktewmxp2
```

### Wrong Resource Group
**Symptom:** "Resource group not found"
**Fix:**
```bash
# Use correct resource group name:
useng-usasset-api-rg
# NOT: USAssetRG, usasset-rg, etc.
```

### File Upload Errors

#### CORS Blocked Error
**Symptom:** "Access to fetch at 'backend-url' from origin 'frontend-url' has been blocked by CORS policy"
**Fix:**
```bash
# Update backend CORS environment variable
az containerapp update \
  --name usasset-backend \
  --resource-group useng-usasset-api-rg \
  --set-env-vars CORS_ORIGIN="https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io"
```

#### Storage Connection Error
**Symptom:** "Failed to upload file" or 500 error on file upload
**Fix:**
```bash
# 1. Check if secret exists
az containerapp secret list \
  --name usasset-backend \
  --resource-group useng-usasset-api-rg \
  --query "[].name" -o tsv

# 2. If missing, add it
az containerapp secret set \
  --name usasset-backend \
  --resource-group useng-usasset-api-rg \
  --secrets azure-storage-connection-string="<CONNECTION-STRING>"

# 3. Restart with environment variable
az containerapp update \
  --name usasset-backend \
  --resource-group useng-usasset-api-rg \
  --set-env-vars AZURE_STORAGE_CONNECTION_STRING=secretref:azure-storage-connection-string
```

#### Network Error in Frontend
**Symptom:** "Network error loading files" on Files page
**Causes & Fixes:**

1. **Frontend using relative URLs instead of full backend URL**
   - Check `apps/frontend/src/components/file-management/useFileOperations.ts`
   - Must use: `const API_BASE = config.api.baseUrl;`
   - Must call: `${API_BASE}/api/files` NOT just `/api/files`

2. **Frontend not built with backend URL**
   ```bash
   # Rebuild frontend with correct API URL
   docker build -f apps/frontend/Dockerfile \
     --build-arg VITE_API_URL=https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io \
     -t frontend:new .
   ```

3. **CORS not configured**
   - See CORS Blocked Error fix above

### Lint Errors Block Deployment
**Symptom:** "Function exceeds 30 lines"
**Fix:** Extract components into separate functions
```typescript
// Before: One big function
const AppContent = () => { /* 40+ lines */ }

// After: Split into components
const VersionFooter = () => { /* footer code */ }
const AppContent = () => { /* now under 30 lines */ }
```

---
**Last Updated**: Sep 3, 2025  
**Status**: WORKING (Frontend 861af17, Backend 861af17)  
**Features**: File Upload with Azure Blob Storage ✅  
**Rule**: Build locally, push to ACR, deploy. Always verify CORS!