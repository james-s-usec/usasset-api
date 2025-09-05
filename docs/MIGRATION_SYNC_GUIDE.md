# Database Migration Sync Guide

## 🚨 CRITICAL UPDATE (2025-09-05)
**PRODUCTION INCIDENT**: Schema drift caused by deploying code with pending migrations that were never applied to production database. This guide has been updated with mandatory prevention steps.

## Overview
Ensuring production database migrations stay synchronized with both codebase AND production database for USAsset API deployment.

## The Problem
Database migrations must be available in production containers for `prisma migrate deploy` to work correctly. If migrations aren't synced to git and deployed with the application, production deployments fail.

## Current Status ⚠️ **NEEDS ADDITIONAL VERIFICATION**
Migrations are **already properly configured** and synced to git, but **2025-09-05 incident revealed this is NOT SUFFICIENT**:

```bash
# Migrations are tracked in git:
git ls-files | grep migration
apps/backend/prisma/migrations/20250828034338_init/migration.sql
apps/backend/prisma/migrations/20250828044828_add_log_entries/migration.sql
apps/backend/prisma/migrations/migration_lock.toml
```

**NEW CRITICAL REQUIREMENT**: Git sync alone is not enough. Migrations must also be applied to production database BEFORE deployment.

## The Two-Part Sync Problem (Discovered 2025-09-05)

### Part 1: Code Sync ✅ (Already Working)
- Migrations committed to git
- Docker containers include migration files
- `prisma migrate deploy` can find migration files

### Part 2: Database Sync ❌ **WAS MISSING** 
- Production database must have migrations applied
- Can't just deploy code and hope migrations apply automatically
- Must verify production database is up-to-date BEFORE deployment

**ROOT CAUSE OF INCIDENT**: Code had migrations, but production database never received them, creating schema drift.

## How It Works

### 1. Migration Creation (Development)
```bash
# Create new migration in development
cd apps/backend
npx prisma migrate dev --name add_new_feature

# This creates:
# - prisma/migrations/YYYYMMDD_HHMMSS_add_new_feature/migration.sql
# - Updates migration_lock.toml
```

### 2. Git Sync (Critical Step)
```bash
# Add migrations to git (REQUIRED for production)
git add apps/backend/prisma/migrations/
git commit -m "feat: add new feature database migration"
git push
```

### 2.5. **NEW MANDATORY STEP**: Production Database Sync
```bash
# Apply migration to production IMMEDIATELY after git push
export DATABASE_URL="$(az keyvault secret show --vault-name usasset-kv-yf2eqktewmxp2 --name database-connection-string --query value -o tsv)"

# Add temporary firewall rule
MY_IP=$(curl -s https://api.ipify.org)
az postgres flexible-server firewall-rule create \
  --resource-group useng-usasset-api-rg \
  --name usasset-db-yf2eqktewmxp2-v2 \
  --rule-name temp-migration-sync \
  --start-ip-address $MY_IP --end-ip-address $MY_IP

# Apply migration to production
npx prisma migrate deploy

# Verify sync
npx prisma migrate status  # Should show "Database schema is up to date!"

# Clean up firewall rule
az postgres flexible-server firewall-rule delete \
  --resource-group useng-usasset-api-rg \
  --name usasset-db-yf2eqktewmxp2-v2 \
  --rule-name temp-migration-sync --yes
```

**WHY THIS IS MANDATORY**: Without this step, production database falls behind code, causing deployment failures and broken APIs.

### 3. Production Deployment
When containers deploy:
```bash
# docker-entrypoint.sh runs:
npx prisma migrate deploy

# This applies all migrations found in prisma/migrations/
# Only works if migrations are present in the container (from git)
```

## GitIgnore Configuration ✅
Migrations are **not ignored** in git:

```bash
# .gitignore contains (correctly commented out):
# apps/backend/prisma/migrations/ # Keep migrations in git for deployment
```

## Dockerfile Integration ✅
Backend Dockerfile includes migrations:

```dockerfile
# Copy Prisma schema and migrations
COPY apps/backend/prisma ./prisma/
# Migrations directory is copied into container
```

## Deployment Script Integration ✅
The deployment script ensures migrations are included:

```bash
# update-azure.sh builds container with full project context:
az acr build --registry $ACR_NAME \
  --file apps/backend/Dockerfile.production \
  /home/james/projects/usasset-api/  # Root context includes migrations
```

## Verification Commands

### Check Migrations in Git
```bash
# List tracked migration files
git ls-files apps/backend/prisma/migrations/

# Check migration history
ls -la apps/backend/prisma/migrations/
```

### Check Container Includes Migrations
```bash
# After deployment, check container logs:
az containerapp logs show -n usasset-backend -g useng-usasset-api-rg --tail 20

# Look for migration output:
# "🔄 Running production migrations..."
# "✅ Migrations deployed!"
```

### Test Migration Status
```bash
# Connect to production database and check migration status
# (This would require database access - normally done through application)
curl https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/health/db
```

## Common Issues & Solutions

### Issue: "No pending migrations" in production
**Cause**: New migrations not committed to git
**Solution**:
```bash
# Always commit migrations before deploying
git add apps/backend/prisma/migrations/
git commit -m "feat: add database migration"
git push
```

### Issue: Migration fails in production
**Cause**: Migration conflicts or database state mismatch
**Solution**:
```bash
# Check migration status in logs
az containerapp logs show -n usasset-backend -g useng-usasset-api-rg --tail 50

# If needed, reset migration state (DANGEROUS - backup first)
# This requires direct database access
```

### Issue: Development migrations not applying
**Cause**: Database out of sync with migration files
**Solution**:
```bash
# Reset development database
npx prisma migrate reset
# OR
npx prisma db push  # Force schema sync
```

## Best Practices

### 1. Always Test Migrations Locally First
```bash
# Test migration on local database
cd apps/backend
npx prisma migrate dev --name test_feature

# Verify it works
npm run start:dev
```

### 2. Commit Migrations Immediately
```bash
# Don't delay - commit migrations right after creation
git add prisma/migrations/
git commit -m "feat: add migration for new feature"
```

### 3. Deploy After Migration Commits
```bash
# Only deploy after migrations are in git
git push
./utilities/deployment/update-azure.sh
# Choose option 1 (backend only) or 3 (both)
```

### 4. Monitor Production Deployment
```bash
# Watch deployment logs for migration success
az containerapp logs show -n usasset-backend -g useng-usasset-api-rg --follow
```

## Migration Workflow Summary

```mermaid
graph LR
    A[Create Migration] --> B[Test Locally]
    B --> C[Commit to Git]
    C --> D[Push to Remote]
    D --> E[Deploy Container]
    E --> F[Migration Auto-Runs]
    F --> G[Production Updated]
```

## Related Files
- `apps/backend/prisma/migrations/` - Migration files (tracked in git)
- `apps/backend/docker-entrypoint.sh` - Runs migrations on container start
- `utilities/deployment/update-azure.sh` - Builds container with migrations
- `.gitignore` - Ensures migrations are tracked, not ignored

## Current Status: ✅ WORKING CORRECTLY
- ✅ Migrations tracked in git
- ✅ Container includes migration files
- ✅ Production runs migrations on startup
- ✅ Deployment script includes migrations
- ✅ GitIgnore properly configured

No fixes needed - system is working as designed.