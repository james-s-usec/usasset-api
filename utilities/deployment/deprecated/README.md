# Deprecated Deployment Scripts

⚠️ **THESE SCRIPTS ARE DEPRECATED - DO NOT USE** ⚠️

## Why These Scripts Were Deprecated

### `update-azure.sh`
- **Issue:** Timeout issues during deployment
- **Problem:** Script doesn't wait long enough for Azure to complete operations
- **Impact:** Caused failed deployments and confusion

### `update-azure-v2.sh`
- **Issue:** Still had timeout issues despite improvements
- **Problem:** Azure operations take longer than script timeouts
- **Impact:** Unreliable deployments

### `deploy-full.sh`
- **Issue:** Outdated deployment approach
- **Problem:** Doesn't follow current SOP best practices
- **Impact:** Inconsistent with current workflow

## What to Use Instead

**📋 Use the Standard Operating Procedure (SOP):**
- **File:** `/docs/DEPLOYMENT_SOP.md`
- **Method:** Build locally, push to ACR, deploy with az commands
- **Benefits:** Reliable, step-by-step, battle-tested

## Migration Path

If you were using these scripts, follow these steps:

1. **Read the SOP:** `/docs/DEPLOYMENT_SOP.md`
2. **Run quality checks:** `npm run ci`
3. **Build locally:** Docker build with proper build args
4. **Push to ACR:** Tag and push images
5. **Deploy:** Use `az containerapp update`
6. **Verify:** Check health endpoints and version footers

## When Were These Deprecated?

**Date:** September 2, 2025  
**Reason:** Deployment reliability issues and SOP standardization  
**Replacement:** `/docs/DEPLOYMENT_SOP.md`

---
**DO NOT USE THESE SCRIPTS** - They will cause deployment failures.