# Azure Deployment Timeout Troubleshooting Guide

## Issue: Deployment Script Times Out During Build

### Problem Summary
- Azure Container Registry (ACR) builds take 3-5 minutes typically
- Claude Code Bash tool defaults to 2-minute timeout
- Script times out but Azure continues building in background
- Results in incomplete/broken images being deployed

### Symptoms
```
Command timed out after 2m 0.0s
[2025-09-02 11:06:06] [INFO] Building backend image...
[timeout occurs here]
```

Later when checking container logs:
```
Cannot find module '/app/apps/backend/dist/src/main.js'
```

### Root Cause Analysis
1. **Build Process**: ACR builds are asynchronous - they continue after CLI timeout
2. **Incomplete Images**: Timeout interrupts during build steps (e.g., Step 29/39)
3. **Image Exists But Broken**: Image gets pushed to registry but missing files
4. **Container Fails**: New revision can't start due to missing compiled files

### Verification Commands
```bash
# Check if build completed
az acr repository show-tags --name usassetacryf2eqktewmxp2 --repository backend --top 5

# Check container revision status
az containerapp revision list -n usasset-backend -g useng-usasset-api-rg --query "[0:3].{Name:name, Active:properties.active, Traffic:properties.trafficWeight}" -o table

# Check container logs for errors
az containerapp logs show -n usasset-backend -g useng-usasset-api-rg --revision usasset-backend--deploy-COMMIT --tail 20
```

### Solutions

#### Option 1: Use Background Monitoring (Recommended)
```bash
# Start build in background and monitor
echo "1" | ./update-azure-v2.sh &
DEPLOY_PID=$!

# Monitor deployment log in real-time
tail -f .logs/azure-deployment_$(date +%Y%m%d)_*.log

# Wait for completion
wait $DEPLOY_PID

# Run verification
./verify-deployment-v2.sh
```

#### Option 2: Manual Build with Extended Timeout
```bash
# Build manually with specific timeout
GIT_COMMIT=$(git rev-parse --short HEAD)
timeout 600 az acr build --registry usassetacryf2eqktewmxp2 \
  --image backend:$GIT_COMMIT \
  --file ./apps/backend/Dockerfile.production \
  .

# Then deploy the built image
az containerapp update \
  --name usasset-backend \
  --resource-group useng-usasset-api-rg \
  --image usassetacryf2eqktewmxp2.azurecr.io/backend:$GIT_COMMIT \
  --revision-suffix "deploy-$GIT_COMMIT"
```

#### Option 3: Check and Resume
```bash
# Check if build is still running
az acr task list-runs --registry usassetacryf2eqktewmxp2 --top 5 -o table

# If running, wait and then deploy
# If failed, restart build
```

### Prevention Strategies

#### 1. Enhanced V2 Script
Add option for existing image deployment:
```bash
# New menu option: "6) Deploy existing image (skip build)"
```

#### 2. Build Status Monitoring
```bash
# Function to check build completion
check_build_status() {
    local build_id=$1
    az acr task show-run --registry usassetacryf2eqktewmxp2 --run-id $build_id --query "status" -o tsv
}
```

#### 3. Retry Logic
```bash
# Implement retry for incomplete builds
if [[ $(check_container_health) == "failed" ]]; then
    log_warning "Container failed to start, rebuilding..."
    rebuild_with_timeout
fi
```

### Cleanup Process

#### 1. Remove Broken Revision
```bash
# List revisions
az containerapp revision list -n usasset-backend -g useng-usasset-api-rg

# Deactivate broken revision
az containerapp revision deactivate -n usasset-backend -g useng-usasset-api-rg --revision BROKEN_REVISION_NAME
```

#### 2. Clean ACR Images (Optional)
```bash
# Remove broken image
az acr repository delete --name usassetacryf2eqktewmxp2 --image backend:BROKEN_COMMIT
```

#### 3. Rebuild and Redeploy
```bash
# Use Option 2 above for clean rebuild
```

### Enhanced Verification

#### Update verify-deployment-v2.sh to detect this issue:
```bash
# Check if container can actually start
check_container_startup() {
    local revision_name=$1
    local logs=$(az containerapp logs show -n usasset-backend -g useng-usasset-api-rg --revision $revision_name --tail 5)
    
    if [[ $logs == *"Cannot find module"* ]]; then
        log_error "Container failed to start - incomplete build detected"
        return 1
    fi
    return 0
}
```

### Best Practices Moving Forward

1. **Always monitor deployment logs** in real-time during builds
2. **Run verification after every deployment** regardless of timeout
3. **Document timeout behavior** as normal Azure operation
4. **Use background monitoring** for long-running operations
5. **Implement retry logic** for failed container starts

### Quick Recovery Commands
```bash
# Emergency: Rollback to previous working version
az containerapp revision activate -n usasset-backend -g useng-usasset-api-rg --revision PREVIOUS_WORKING_REVISION

# Clean rebuild (from project root)
cd utilities/deployment
GIT_COMMIT=$(git rev-parse --short HEAD)
echo "Building backend with extended timeout..."
timeout 600 az acr build --registry usassetacryf2eqktewmxp2 --image backend:$GIT_COMMIT --file ../../apps/backend/Dockerfile.production ../../
echo "Deploying built image..."
az containerapp update --name usasset-backend --resource-group useng-usasset-api-rg --image usassetacryf2eqktewmxp2.azurecr.io/backend:$GIT_COMMIT --revision-suffix "deploy-$GIT_COMMIT"
echo "Verifying deployment..."
./verify-deployment-v2.sh
```

## Related Issues
- [TROUBLESHOOTING_LOG_CLI_BACKEND_ISSUE.md](./TROUBLESHOOTING_LOG_CLI_BACKEND_ISSUE.md) - Frontend/Backend communication issues
- [docs/DEPLOYMENT_SCRIPT_GUIDE.md](./docs/DEPLOYMENT_SCRIPT_GUIDE.md) - V2 script usage guide
- [utilities/deployment/README.md](./utilities/deployment/README.md) - Deployment scripts overview

## Status
- **Identified**: 2025-09-02
- **Root Cause**: Claude Code Bash tool timeout vs Azure build duration
- **Solution Status**: Documented and verified
- **Prevention**: Enhanced verification and background monitoring implemented