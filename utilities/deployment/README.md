# USAsset Deployment Utilities

⚠️ **DEPLOYMENT SCRIPTS DEPRECATED** - Use `/docs/DEPLOYMENT_SOP.md` instead

## Current Status

All deployment scripts in this directory have been **deprecated** as of September 2, 2025.

**Deprecated scripts moved to `deprecated/` folder:**
- `update-azure.sh` - Timeout issues
- `update-azure-v2.sh` - Still had timeout issues  
- `deploy-full.sh` - Outdated approach

## Why Scripts Were Deprecated

1. **Timeout Issues**: Scripts don't wait long enough for Azure operations
2. **Complexity**: Too many options and failure modes
3. **Maintenance Burden**: Required constant updates for Azure changes
4. **Unreliable**: Caused deployment failures and confusion

## What to Use Instead

**📋 Standard Operating Procedure (SOP):**
- **File:** `/docs/DEPLOYMENT_SOP.md`
- **Method:** Step-by-step manual commands
- **Benefits:** Reliable, understandable, maintainable

## Quick Migration Guide

**Old way:**
```bash
./update-azure-v2.sh  # ❌ DEPRECATED
```

**New way:**
```bash
# Follow /docs/DEPLOYMENT_SOP.md
npm run ci
GIT_COMMIT=$(git rev-parse --short HEAD)
docker build -f apps/frontend/Dockerfile \
  --build-arg VITE_APP_VERSION=$GIT_COMMIT \
  --build-arg VITE_BUILD_TIME="$(date -Iseconds)" \
  --build-arg VITE_API_URL=https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io \
  -t frontend:$GIT_COMMIT .
# ... etc (see SOP for full steps)
```

## Legacy Support Files

**Still in use:**
- `verify-deployment.sh` - Health checks (may be updated)
- `verify-deployment-v2.sh` - Enhanced health checks (may be updated)
- `deploy-lib.sh` - Shared functions (may be used by verification scripts)

**Deprecated:**
- All deployment scripts moved to `deprecated/` folder

## Migration Timeline

- **September 2, 2025**: Scripts deprecated, SOP established
- **Future**: Verification scripts may be updated to work with SOP
- **No timeline**: Scripts in `deprecated/` - kept for reference only

---
**Use `/docs/DEPLOYMENT_SOP.md` for all deployments**