# Azure Container Apps Deployment Guide

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Common Issues & Solutions](#common-issues--solutions)
3. [Essential Azure CLI Commands](#essential-azure-cli-commands)
4. [Deployment Process](#deployment-process)
5. [Debugging Container Issues](#debugging-container-issues)
6. [Database Connection Issues](#database-connection-issues)
7. [Emergency Recovery](#emergency-recovery)

## Pre-Deployment Checklist

### Before You Deploy - MUST CHECK
- [ ] **DATABASE_URL has URL-encoded password** (special chars like `/`, `=`, `@` must be encoded)
- [ ] **docker-entrypoint.sh can parse DATABASE_URL** (no separate DB_HOST needed)
- [ ] **All required files in git** (check `.gitignore` and `.dockerignore`)
- [ ] **Dockerfile uses correct user/group** (UID/GID 1001, not 1000)
- [ ] **Key Vault secrets exist and are correct**
- [ ] **Environment variables match what app expects**

## Common Issues & Solutions

### Issue 1: Container Stuck on "postgres hostname not found"
**Symptoms:**
```
getaddrinfo for host "postgres" port 5432: Name does not resolve
```

**Root Cause:** docker-entrypoint.sh expects DB_HOST but Azure only provides DATABASE_URL

**Solution:**
```bash
# Fix docker-entrypoint.sh to parse DATABASE_URL:
if [ -n "$DATABASE_URL" ]; then
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\)/.*|\1|p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*@[^:]*:\([0-9]*\)/.*|\1|p')
fi
```

### Issue 2: Prisma Error P1013 - Invalid Database URL
**Symptoms:**
```
P1013: The provided database string is invalid. invalid port number in database URL
```

**Root Cause:** Password contains special characters that aren't URL-encoded

**Solution:**
```bash
# URL-encode the password
PASSWORD="your/password/with=special"
ENCODED_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$PASSWORD', safe=''))")

# Update DATABASE_URL
DATABASE_URL="postgresql://dbadmin:${ENCODED_PASSWORD}@host:5432/database?sslmode=require"

# Update Key Vault
az keyvault secret set --vault-name YOUR_VAULT --name database-connection-string --value "$DATABASE_URL"

# Update Container App
az containerapp secret set -n YOUR_APP -g YOUR_RG --secrets "database-url=$DATABASE_URL"
```

### Issue 3: New Code Not Deploying
**Symptoms:**
- Built new image but container runs old code
- `/version` endpoint returns 404 or old version

**Root Cause:** `az containerapp revision restart` doesn't pull new images

**Solution:**
```bash
# WRONG - this just restarts existing container
az containerapp revision restart -n app-name -g rg-name --revision revision-name

# RIGHT - this deploys new image
GIT_COMMIT=$(git rev-parse --short HEAD)
az containerapp update \
  --name app-name \
  --resource-group rg-name \
  --image registry.azurecr.io/backend:$GIT_COMMIT \
  --revision-suffix "deploy-$GIT_COMMIT"
```

### Issue 4: Missing Files in Docker Build
**Symptoms:**
```
Cannot find module './logs/logs.module'
```

**Root Cause:** `.gitignore` or `.dockerignore` excluding needed files

**Solution:**
```bash
# Check .gitignore - be specific!
# BAD: logs (matches src/logs)
# GOOD: /logs (only root logs folder)

# Check .dockerignore
# BAD: **/logs (excludes ALL logs dirs)
# GOOD: logs/ (only root logs)
```

## Essential Azure CLI Commands

### Build & Deploy
```bash
# Set variables
RG="useng-usasset-api-rg"
APP="usasset-backend"
ACR="usassetacryf2eqktewmxp2"
GIT_COMMIT=$(git rev-parse --short HEAD)

# Build image in ACR (from monorepo root!)
az acr build --registry $ACR \
  --image backend:latest \
  --image backend:$GIT_COMMIT \
  --file ./apps/backend/Dockerfile.production \
  .

# Deploy new image
az containerapp update \
  --name $APP \
  --resource-group $RG \
  --image $ACR.azurecr.io/backend:$GIT_COMMIT \
  --revision-suffix "deploy-$GIT_COMMIT" \
  --set-env-vars APP_VERSION=$GIT_COMMIT BUILD_TIME=$(date -Iseconds)
```

### Debugging Commands
```bash
# Check logs (last 50 lines)
az containerapp logs show -n $APP -g $RG --tail 50

# List revisions
az containerapp revision list -n $APP -g $RG \
  --query "[0:5].{Name:name, Created:properties.createdTime, Active:properties.active}" \
  -o table

# Check environment variables
az containerapp show -n $APP -g $RG \
  --query "properties.template.containers[0].env[]" -o json

# Check secrets (names only, not values)
az containerapp secret list -n $APP -g $RG --query "[].name" -o tsv

# Get Key Vault secret
az keyvault secret show --vault-name YOUR_VAULT --name secret-name --query "value" -o tsv
```

### Testing Endpoints
```bash
URL="https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io"

# Test all endpoints
curl $URL/                    # Root
curl $URL/version             # Version info
curl $URL/health              # Health check
curl $URL/health/db           # Database health
curl -X POST $URL/logs \
  -H "Content-Type: application/json" \
  -d '{"level": "INFO", "message": "Test log"}'
```

## Deployment Process

### Step-by-Step Deployment
1. **Pre-flight checks**
   ```bash
   # Verify local build works
   npm run ci
   
   # Check Dockerfile builds
   docker build -f apps/backend/Dockerfile.production -t test .
   ```

2. **Build in ACR**
   ```bash
   GIT_COMMIT=$(git rev-parse --short HEAD)
   az acr build --registry $ACR \
     --image backend:$GIT_COMMIT \
     --file ./apps/backend/Dockerfile.production \
     .
   ```

3. **Deploy to Container Apps**
   ```bash
   az containerapp update \
     --name $APP \
     --resource-group $RG \
     --image $ACR.azurecr.io/backend:$GIT_COMMIT \
     --revision-suffix "deploy-$GIT_COMMIT"
   ```

4. **Verify deployment**
   ```bash
   # Check logs
   az containerapp logs show -n $APP -g $RG --tail 20
   
   # Test endpoints
   curl https://YOUR_URL/version
   ```

## Debugging Container Issues

### Container Won't Start
```bash
# 1. Check recent logs
az containerapp logs show -n $APP -g $RG --tail 100

# 2. Check if database is reachable
az containerapp logs show -n $APP -g $RG --tail 100 | grep -i database

# 3. Check environment variables
az containerapp show -n $APP -g $RG \
  --query "properties.template.containers[0].env[].name" -o tsv

# 4. Verify secrets are set
az containerapp secret list -n $APP -g $RG
```

### Database Connection Debugging
```bash
# 1. Get DATABASE_URL from Key Vault
DATABASE_URL=$(az keyvault secret show \
  --vault-name YOUR_VAULT \
  --name database-connection-string \
  --query "value" -o tsv)

# 2. Parse and test connection
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\)/.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*@[^:]*:\([0-9]*\)/.*|\1|p')

# 3. Test DNS resolution
nslookup $DB_HOST

# 4. Test port connectivity
nc -zv $DB_HOST $DB_PORT
```

## Emergency Recovery

### Rollback to Previous Version
```bash
# List recent revisions
az containerapp revision list -n $APP -g $RG --query "[0:5].name" -o tsv

# Activate previous revision
az containerapp revision activate -n $APP -g $RG --revision PREVIOUS_REVISION_NAME
```

### Force Restart
```bash
# Restart current revision
CURRENT_REVISION=$(az containerapp show -n $APP -g $RG --query "properties.latestRevisionName" -o tsv)
az containerapp revision restart -n $APP -g $RG --revision $CURRENT_REVISION
```

### Update Secrets Without Rebuilding
```bash
# Update secret directly
az containerapp secret set -n $APP -g $RG --secrets "secret-name=new-value"

# Restart to apply
az containerapp revision restart -n $APP -g $RG \
  --revision $(az containerapp show -n $APP -g $RG --query "properties.latestRevisionName" -o tsv)
```

## Managed Identity Setup (for Key Vault)
```bash
# Enable managed identity
IDENTITY="/subscriptions/YOUR_SUB/resourceGroups/$RG/providers/Microsoft.ManagedIdentity/userAssignedIdentities/YOUR_IDENTITY"
az containerapp identity assign -n $APP -g $RG --user-assigned $IDENTITY

# Grant Key Vault access
az keyvault set-policy --name YOUR_VAULT \
  --object-id $(az identity show -n YOUR_IDENTITY -g $RG --query principalId -o tsv) \
  --secret-permissions get list

# Use Key Vault reference in secrets
az containerapp secret set -n $APP -g $RG \
  --secrets database-url=keyvaultref:https://YOUR_VAULT.vault.azure.net/secrets/database-connection-string,identityref:$IDENTITY
```

## Key Files to Check

### docker-entrypoint.sh
- Must parse DATABASE_URL if DB_HOST not provided
- Must handle Azure's environment (no separate DB_HOST)

### .dockerignore
- Don't exclude source code directories
- Be specific: `logs/` not `**/logs`

### .gitignore
- Use `/logs` not `logs` to avoid matching src/logs
- Ensure all source code is committed

### Dockerfile.production
- Use UID/GID 1001 (not 1000 - already taken in Alpine)
- Include proper error handling in entrypoint

## Resource Naming Convention
```
Resource Group: useng-usasset-api-rg
Container App: usasset-backend
ACR: usassetacryf2eqktewmxp2
Key Vault: usasset-kv-yf2eqktewmxp2
Database: usasset-db-yf2eqktewmxp2-v2
Identity: usasset-identity-yf2eqktewmxp2
Environment: usasset-env-yf2eqktewmxp2
```

## Testing Checklist After Deployment
- [ ] Root endpoint returns data with correlationId
- [ ] /version shows correct git commit
- [ ] /health returns ok status
- [ ] /health/db shows connected
- [ ] POST to /logs creates log entry
- [ ] Check Azure logs for any errors
- [ ] Verify database migrations applied
- [ ] Test from frontend (if applicable)

## Still Having Issues?
1. Save full logs: `az containerapp logs show -n $APP -g $RG --tail 500 > debug.log`
2. Check ACR build logs: `az acr task list-runs --registry $ACR --top 5 -o table`
3. Verify image exists: `az acr repository show-tags --name $ACR --repository backend --top 5`
4. Check Container App events in Azure Portal
5. Review this guide again - the answer is probably here!