# Azure Container Apps Build & Deploy Process - Complete Explanation

## The Problem We Keep Hitting
**The new revision fails with: "Cannot find module '/app/apps/backend/dist/src/main.js'"**

This happens because the TypeScript build step in the Dockerfile fails or times out, but Azure still creates and deploys the image anyway - just without the compiled JavaScript files!

## How Azure Container Registry (ACR) Build Actually Works

### 1. What Happens When We Run `az acr build`
```bash
az acr build --registry usassetacryf2eqktewmxp2 \
  --image backend:7b4411e \
  --file apps/backend/Dockerfile.production .
```

**Step-by-step process:**
1. **Upload**: Your entire project directory gets uploaded to Azure (minus .dockerignore files)
2. **Cloud Build**: Azure runs Docker build in their cloud infrastructure
3. **Multi-stage Build**: Our Dockerfile has 2 stages:
   - **Builder Stage**: Installs deps, runs `npm run build` to compile TypeScript
   - **Production Stage**: Copies only the compiled `dist/` folder
4. **Push to Registry**: Completed image pushed to ACR
5. **Tag**: Image tagged with commit hash

### 2. Where It Fails
The problem occurs in the Builder stage at this line in Dockerfile.production:
```dockerfile
# This is where it breaks!
RUN npm run build
```

If this times out or fails:
- Azure still completes the remaining steps
- The COPY command finds no dist/ folder to copy
- Image gets created WITHOUT the compiled code
- Container starts but immediately crashes

## How to Verify What Actually Got Built

### Check Build Logs in ACR
```bash
# See if the build actually completed
az acr task list-runs --registry usassetacryf2eqktewmxp2 --top 5 -o table

# Get detailed logs of a specific build
az acr task logs --registry usassetacryf2eqktewmxp2 --run-id caw
```

### Check What's in the Image
```bash
# Pull the image locally and inspect it
docker pull usassetacryf2eqktewmxp2.azurecr.io/backend:7b4411e
docker run --rm -it usassetacryf2eqktewmxp2.azurecr.io/backend:7b4411e sh

# Inside container, check if dist exists:
ls -la /app/apps/backend/
# Should see: dist/ folder with compiled JS files
```

### Check Container Logs
```bash
# See why container is failing
az containerapp logs show -n usasset-backend -g useng-usasset-api-rg \
  --revision usasset-backend--deploy-7b4411e --tail 50
```

## Real Troubleshooting Approach

### Option 1: Build Locally First (Most Reliable)
```bash
# Build and test locally
cd /home/james/projects/usasset-api
docker build -f apps/backend/Dockerfile.production -t test-backend .
docker run --rm test-backend ls -la /app/apps/backend/dist/

# If it works locally, push to ACR
docker tag test-backend usassetacryf2eqktewmxp2.azurecr.io/backend:7b4411e
docker push usassetacryf2eqktewmxp2.azurecr.io/backend:7b4411e

# Then deploy the pre-built image
az containerapp update \
  --name usasset-backend \
  --resource-group useng-usasset-api-rg \
  --image usassetacryf2eqktewmxp2.azurecr.io/backend:7b4411e
```

### Option 2: Use Azure Build with Monitoring
```bash
# Start build and capture the run ID
RUN_ID=$(az acr build --registry usassetacryf2eqktewmxp2 \
  --image backend:test \
  --file apps/backend/Dockerfile.production . \
  --query runId -o tsv)

# Monitor build progress in real-time
az acr task logs --registry usassetacryf2eqktewmxp2 --run-id $RUN_ID --follow

# Check if build succeeded
az acr task list-runs --registry usassetacryf2eqktewmxp2 \
  --run-ids $RUN_ID --query "[0].runStatus" -o tsv
```

### Option 3: Simplify the Dockerfile (Debug Mode)
Create a simpler Dockerfile that's less likely to fail:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build || (echo "Build failed, showing errors:" && ls -la && exit 1)
CMD ["node", "apps/backend/dist/src/main.js"]
```

## How to Know the ACTUAL Deployed Version

### 1. Check Active Revision
```bash
# Which revision has traffic?
az containerapp revision list -n usasset-backend -g useng-usasset-api-rg \
  --query "[?properties.trafficWeight > 0].{Name:name, Traffic:properties.trafficWeight}" -o table
```

### 2. Check if Container is Running
```bash
# Is the container actually healthy?
az containerapp revision show -n usasset-backend -g useng-usasset-api-rg \
  --revision usasset-backend--deploy-7b4411e \
  --query "properties.runningState" -o tsv
```

### 3. Check the REAL Health Endpoint
```bash
# Get actual response from running container
curl -s https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/health | jq

# Check the uptime - if it's hours/days old, you're hitting old container!
```

## The Nuclear Option: Force Clean Rebuild

```bash
# 1. Delete the broken image from ACR
az acr repository delete --name usassetacryf2eqktewmxp2 --image backend:7b4411e

# 2. Build locally with full output
cd /home/james/projects/usasset-api
npm run build --workspace=backend  # Ensure this works first!

# 3. Build Docker image locally
docker build -f apps/backend/Dockerfile.production -t backend:local . --progress=plain

# 4. Tag and push
docker tag backend:local usassetacryf2eqktewmxp2.azurecr.io/backend:7b4411e-fixed
az acr login --name usassetacryf2eqktewmxp2
docker push usassetacryf2eqktewmxp2.azurecr.io/backend:7b4411e-fixed

# 5. Deploy the working image
az containerapp update \
  --name usasset-backend \
  --resource-group useng-usasset-api-rg \
  --image usassetacryf2eqktewmxp2.azurecr.io/backend:7b4411e-fixed \
  --revision-suffix deploy-7b4411e-fixed
```

## Why Our Current Setup Fails

1. **ACR build timeout**: Default timeout might be too short for TypeScript compilation
2. **No build verification**: Script doesn't check if dist/ was created
3. **Silent failures**: Azure creates image even if build steps fail
4. **Old revision fallback**: Azure keeps old working revision running (that's why you see old uptime)

## Permanent Fix Recommendations

1. **Add build verification to Dockerfile**:
```dockerfile
RUN npm run build && \
    test -d dist || (echo "Build failed: dist not found" && exit 1)
```

2. **Add health check to deployment script**:
```bash
# After deployment, verify the NEW revision is actually serving traffic
DEPLOYED_VERSION=$(curl -s $BACKEND_URL/health | jq -r '.data.appVersion')
if [[ "$DEPLOYED_VERSION" != "$GIT_COMMIT" ]]; then
  echo "ERROR: Deployed version mismatch!"
  exit 1
fi
```

3. **Use staged deployment**:
- Deploy to staging slot first
- Verify it works
- Then swap to production

## Current Status Check Commands

```bash
# 1. What's actually running?
curl -s https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/health | jq '.data.uptime'
# If uptime > 300 seconds, you're still on OLD container

# 2. What revision has traffic?
az containerapp revision list -n usasset-backend -g useng-usasset-api-rg --query "[?properties.trafficWeight > 0]" -o table

# 3. Why is new revision failing?
az containerapp logs show -n usasset-backend -g useng-usasset-api-rg --revision usasset-backend--deploy-7b4411e --tail 50 | grep -i error
```