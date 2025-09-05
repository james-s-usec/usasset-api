# Azure Production Database Investigation Report

**Date**: 2025-09-05  
**Issue**: Seeding Azure production failed - migrations are drifted on prod  
**Status**: 🚨 **CRITICAL** - Production database schema is severely out of date

## 🔍 **Investigation Summary**

### Root Cause Identified
**Production database schema is missing 3 critical migrations** that were added after the last deployment:
1. `20250905142935_add_asset_column_aliases` 
2. `20250905184105_add_phase_result_tracking`
3. `20250905184800_fix_folders_and_files_schema`

### Evidence from Logs
```
column `folders.project_id` does not exist in the current database.
```

This error confirms that the production database is running on an **old schema** that predates recent folder/file system changes.

### Current Production Status
- **Backend Health**: ✅ Running (version e301ff1)
- **Database Schema**: ❌ **3 migrations behind**
- **Seeding Status**: ❌ **Cannot seed** - schema mismatch prevents seeding
- **User Count**: 2 (should be 6 after proper seeding)
- **Folder API**: ❌ **500 errors** due to missing `project_id` column

## 📊 **Detailed Findings**

### Production Database State
- **Connection**: Working (can reach database)
- **Schema Version**: Old (missing recent folder/file changes)
- **Missing Migrations**: 3 pending migrations not applied
- **Seeding**: Failed due to schema incompatibility

### Impact Assessment
| Component | Status | Impact |
|-----------|--------|---------|
| Backend API | ✅ Running | App starts but API calls fail |
| Folders API | ❌ 500 errors | `folders.project_id` column missing |
| Files API | ❌ Likely broken | Schema changes not applied |
| User Management | ⚠️ Partial | Only 2 users instead of 6 |
| Pipeline System | ❌ Missing tables | PhaseResult tracking not available |
| Asset Column Aliases | ❌ Missing table | ETL import mappings unavailable |

### Missing Schema Components

#### 1. Asset Column Aliases (`20250905142935`)
- **Missing Table**: `AssetColumnAlias`  
- **Impact**: ETL pipeline CSV import field mappings not available
- **Used by**: Pipeline field mapping system

#### 2. Phase Result Tracking (`20250905184105`)
- **Missing Table**: `PhaseResult`
- **Impact**: ETL intermediate step logging not working (the feature we just added!)
- **Used by**: New ETL phase results endpoints

#### 3. Folder/File Schema Fix (`20250905184800`)
- **Missing Column**: `folders.project_id`
- **Impact**: Folders API completely broken (500 errors)
- **Used by**: File management and project organization

## 🛠️ **Fix Recommendations**

### Option 1: Apply Missing Migrations (RECOMMENDED)
**Safest approach** - applies only the missing changes:

```bash
# 1. Connect to production database and apply pending migrations
cd apps/backend
export DATABASE_URL="$(az keyvault secret show --vault-name usasset-kv-yf2eqktewmxp2 --name database-connection-string --query value -o tsv)"
npx prisma migrate deploy

# 2. Run seeding after migrations complete
npx prisma db seed

# 3. Verify all systems working
curl https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/api/folders
curl https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/api/users
```

**Pros**: 
- ✅ Non-destructive (preserves existing data)
- ✅ Applies only what's needed
- ✅ Follows standard migration process
- ✅ Can be done immediately

**Cons**:
- ⚠️ Requires Azure database firewall access

### Option 2: Database Reset and Re-seed (NUCLEAR)
**Complete reset** - destroys all data and rebuilds from scratch:

```bash
# 1. Reset database (DESTRUCTIVE!)
cd apps/backend
export DATABASE_URL="$(az keyvault secret show --vault-name usasset-kv-yf2eqktewmxp2 --name database-connection-string --query value -o tsv)"
npx prisma migrate reset --force

# 2. Seed with fresh data
npx prisma db seed
```

**Pros**:
- ✅ Guaranteed clean state
- ✅ All migrations applied correctly

**Cons**:
- ❌ **DESTROYS ALL PRODUCTION DATA**
- ❌ Loses any user-created content
- ❌ Extreme measure for this issue

### Option 3: Container App Migration (AUTOMATED)
**Deploy with migration** - let the container handle it:

```bash
# 1. Deploy backend with migration enabled
az containerapp update \
  --name usasset-backend \
  --resource-group useng-usasset-api-rg \
  --set-env-vars RUN_MIGRATIONS=true RUN_SEED=true

# 2. Monitor logs for migration completion
az containerapp logs show \
  --name usasset-backend \
  --resource-group useng-usasset-api-rg \
  --follow
```

**Pros**:
- ✅ Uses existing deployment infrastructure
- ✅ Automated process
- ✅ Includes seeding

**Cons**:
- ⚠️ Backend container needs migration capability added
- ⚠️ Requires code changes to support RUN_MIGRATIONS

## ⚡ **Immediate Action Plan**

### Step 1: Network Access Setup
The main blocker is Azure database firewall. Fix by adding your IP:

```bash
# Get your current IP
MY_IP=$(curl -s https://api.ipify.org)
echo "Your IP: $MY_IP"

# Add firewall rule for your IP
az postgres flexible-server firewall-rule create \
  --resource-group useng-usasset-api-rg \
  --name usasset-db-yf2eqktewmxp2-v2 \
  --rule-name allow-local-dev \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP
```

### Step 2: Apply Missing Migrations
```bash
cd apps/backend
export DATABASE_URL="$(az keyvault secret show --vault-name usasset-kv-yf2eqktewmxp2 --name database-connection-string --query value -o tsv)"

# Apply the 3 pending migrations
npx prisma migrate deploy

# Expected output: 
# ✅ 20250905142935_add_asset_column_aliases applied
# ✅ 20250905184105_add_phase_result_tracking applied  
# ✅ 20250905184800_fix_folders_and_files_schema applied
```

### Step 3: Run Seeding
```bash
# Seed the database with proper data
npx prisma db seed

# Expected output:
# ✅ Seeded users: { admin, superAdmin, user, tomPoeling, leviMorgan, jamesSwanson }
# ✅ Seeded projects: Edwards Pavillion, Shaw Cancer Center, Wichita Animal Hospital
# ✅ Seeded folders: Calculations, Controls, Cost Estimates...
```

### Step 4: Verification
```bash
# Test all critical endpoints
curl https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/api/folders
curl https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/api/users
curl https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/api/pipeline/rules

# Expected results:
# Users: 6 (instead of current 2)
# Folders: 9 (instead of current error)
# Pipeline rules: 4+ (instead of current error)
```

### Step 5: Cleanup
```bash
# Remove temporary firewall rule
az postgres flexible-server firewall-rule delete \
  --resource-group useng-usasset-api-rg \
  --name usasset-db-yf2eqktewmxp2-v2 \
  --rule-name allow-local-dev \
  --yes
```

## 🔮 **Prevention for Future**

### Add Migration Check to Deployment
Update deployment scripts to verify migration status before deploying:

```bash
# Add to deployment SOP
echo "Checking migration status..."
npx prisma migrate status
if [ $? -ne 0 ]; then
  echo "❌ Migrations not applied! Run 'npx prisma migrate deploy' first"
  exit 1
fi
```

### Container App Auto-Migration
Consider adding migration capability to backend container startup:

```typescript
// In main.ts or bootstrap
if (process.env.RUN_MIGRATIONS === 'true') {
  await prisma.$executeRaw`SELECT 1`; // Test connection
  // Run migrations programmatically
}
```

## 📋 **Timeline Estimates**

| Task | Estimated Time | Risk Level |
|------|---------------|------------|
| Network setup (firewall) | 2 minutes | Low |
| Apply 3 migrations | 30 seconds | Low |
| Run seeding | 2 seconds | Low |
| Verification testing | 5 minutes | Low |
| Cleanup | 1 minute | Low |
| **Total** | **~10 minutes** | **Low** |

## 🚨 **Risk Assessment**

**Risk Level**: ⚠️ **LOW-MODERATE**
- Migrations are additive (no data loss risk)
- Database has minimal production data currently
- Rollback possible by keeping current revision active

**Mitigation**:
- Test on local database first ✅ (already done)
- Keep current container revision active during migration
- Monitor logs during process

## 📝 **Executive Summary**

The Azure production seeding failure is caused by **database schema drift** - the production database is missing 3 recent migrations that add critical tables and columns. This prevents both seeding and normal API operations.

**Recommended Fix**: Apply the 3 pending migrations directly to production database, then run seeding. This is a low-risk, 10-minute fix that will restore full functionality.

**Alternative**: If network access is blocked, we can add auto-migration capability to the backend container and deploy with migration enabled.

The issue is **easily fixable** and represents a process gap rather than a code problem. After fixing, we should add migration status checks to the deployment process to prevent future drift.