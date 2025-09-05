# Migration Management SOP

**Standard Operating Procedure for Database Migrations in USAsset3**

Version: 1.0  
Last Updated: 2025-09-05  
Audience: Backend developers, DevOps engineers

## Overview

This SOP provides procedures for managing database migrations in the USAsset3 project using Prisma ORM. Following these procedures prevents data loss, schema drift, and broken deployments.

## ⚠️ CRITICAL RULES

### 1. Never Touch Production Databases Manually
- **NEVER** run `prisma migrate reset` on production
- **NEVER** run `prisma db push` on production  
- **ALWAYS** use `prisma migrate deploy` for production

### 2. Migration Sequence Rules
- **ALWAYS** commit schema changes before deployment
- **ALWAYS** test migrations on development first
- **NEVER** modify existing migration files
- **NEVER** skip migration steps

### 3. Schema Drift Detection
- **ALWAYS** run `prisma migrate status` before changes
- **ALWAYS** fix drift before creating new migrations
- **NEVER** ignore drift warnings

## Common Migration Scenarios

### Scenario 1: Adding New Fields to Existing Tables

**Steps:**
1. **Check current status**
   ```bash
   npx prisma migrate status
   ```

2. **Modify schema.prisma**
   ```prisma
   model User {
     id    String @id @default(uuid())
     email String @unique
     // Add new field
     phone String?  // Optional field - safe to add
   }
   ```

3. **Create migration**
   ```bash
   npx prisma migrate dev --name add_phone_to_users
   ```

4. **Verify migration**
   ```bash
   npx prisma migrate status
   npm run build  # Check TypeScript compilation
   ```

### Scenario 2: Schema Drift Detected

**Problem:** Database doesn't match schema.prisma

**Solution:**
1. **Pull current database schema**
   ```bash
   npx prisma db pull
   ```

2. **Review changes and decide:**
   - If database is correct: Keep pulled changes
   - If schema.prisma is correct: Create migration to fix database

3. **Apply fixes**
   ```bash
   # Option A: Database is correct
   npx prisma generate

   # Option B: Schema is correct  
   npx prisma db push --accept-data-loss  # Development only!
   ```

### Scenario 2B: Using db push for Rapid Development

**When to use `db push`:**
- Development environment only
- Rapid prototyping of schema changes
- Schema drift resolution when database is behind

**Workflow:**
1. **Make schema changes in schema.prisma**
2. **Push changes directly**
   ```bash
   npx prisma db push --accept-data-loss  # Skip migration creation
   ```
3. **Create proper migration later**
   ```bash
   npx prisma migrate dev --name describe_changes_made
   ```

**⚠️ CRITICAL:** After using `db push`, you MUST create a proper migration to document the changes:
```bash
# Method 1: Create migration with current schema diff
npx prisma migrate diff --from-migrations ./prisma/migrations --to-schema-datamodel ./prisma/schema.prisma --script > migration.sql

# Method 2: Mark schema as applied (if changes already in database)
npx prisma migrate resolve --applied MIGRATION_NAME
```

### Scenario 3: Migration Locks/Timeouts

**Problem:** Migration hangs with advisory lock errors

**Solution:**
1. **Restart database**
   ```bash
   docker-compose restart postgres
   # Wait 30 seconds for full restart
   ```

2. **Check for hung connections**
   ```bash
   PGPASSWORD=localpassword123 psql -h localhost -p 5433 -U dbadmin -d usasset -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
   ```

3. **Retry migration**
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

### Scenario 4: Broken Seed Script After Schema Changes

**Problem:** TypeScript errors in seed.ts after schema changes

**Solution:**
1. **Regenerate Prisma client**
   ```bash
   npx prisma generate
   ```

2. **Update imports in seed.ts**
   ```typescript
   // Check what enums/types exist
   import { PrismaClient, UserRole, /* other enums */ } from '@prisma/client';
   ```

3. **Fix field references**
   ```typescript
   // Update to match schema.prisma field names
   const user = await prisma.user.create({
     data: {
       email: 'test@example.com',
       // Use correct field names from schema
     }
   });
   ```

## Development Workflow

### Daily Development
```bash
# 1. Start work - check status
npx prisma migrate status

# 2. Make schema changes in schema.prisma
# 3. Create migration
npx prisma migrate dev --name descriptive_name

# 4. Test changes
npm run build
npx prisma db seed  # If applicable

# 5. Commit changes
git add .
git commit -m "feat: add phone field to users"
```

### Before Deployment
```bash
# 1. Ensure all migrations committed
git status

# 2. Check migration status
npx prisma migrate status

# 3. Test full reset and seed (development only)
npx prisma migrate reset --force
npx prisma db seed

# 4. Build and test
npm run build
npm run test
```

## Production Deployment

### Azure Container Apps Deployment
```bash
# Migrations run automatically in docker-entrypoint.sh:
npx prisma migrate deploy  # Applies pending migrations
npm run start:prod         # Starts application
```

### Manual Production Migration (Emergency Only)
```bash
# 1. Connect to production database (via Azure)
DATABASE_URL="production_url" npx prisma migrate status

# 2. Apply specific migration
DATABASE_URL="production_url" npx prisma migrate deploy

# 3. Verify
DATABASE_URL="production_url" npx prisma migrate status
```

## Troubleshooting Guide

### Problem: "Migration is in a failed state"
**Solution:**
```bash
# Mark migration as applied (if manually fixed)
npx prisma migrate resolve --applied 20231201_migration_name

# Or mark as rolled back (if migration failed)
npx prisma migrate resolve --rolled-back 20231201_migration_name
```

### Problem: "Database schema is out of sync"
**Solution:**
```bash
# Development: Force sync
npx prisma db push --accept-data-loss

# Production: Create corrective migration
npx prisma migrate diff --from-schema-datamodel schema.prisma --to-schema-datasource schema.prisma
```

### Problem: "Cannot connect to database"
**Solution:**
```bash
# Check database is running
docker-compose ps

# Restart database
docker-compose restart postgres

# Check connection string
echo $DATABASE_URL
```

### Problem: "Prisma Client out of sync"
**Solution:**
```bash
# Regenerate client
npx prisma generate

# Clear cache
rm -rf node_modules/.prisma
npm run build
```

## File Locations

### Migration Files
- **Location:** `apps/backend/prisma/migrations/`
- **Format:** `YYYYMMDD_HHMMSS_migration_name/migration.sql`
- **Never modify** existing migration files

### Key Files
- **Schema:** `apps/backend/prisma/schema.prisma`
- **Seed:** `apps/backend/prisma/seed.ts`
- **Config:** `apps/backend/package.json` (prisma section)

## Best Practices

### Schema Design
1. **Always add optional fields first** (`field String?`)
2. **Use enums for constrained values**
3. **Add indexes for query performance**
4. **Include audit fields** (created_at, updated_at, is_deleted)

### Migration Naming
- `add_field_to_table` - Adding fields
- `create_table_name` - New tables
- `update_table_constraints` - Constraint changes
- `fix_schema_drift` - Correcting drift

### Testing
1. **Always test migrations on development**
2. **Test with existing data** (via seed script)
3. **Verify TypeScript compilation**
4. **Test rollback scenarios**

## Emergency Procedures

### Complete Database Reset (Development Only)
```bash
# Nuclear option - destroys all data
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="emergency reset" npx prisma migrate reset --force
npx prisma db seed
```

### Production Rollback
```bash
# 1. Identify problem migration
npx prisma migrate status

# 2. Rollback to previous working state
# (This requires manual SQL - contact DBA)

# 3. Mark problematic migration as rolled back
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

## Monitoring and Alerts

### Health Checks
- Monitor migration status in deployment logs
- Alert on failed migrations
- Track schema drift in CI/CD

### Metrics to Track
- Migration execution time
- Failed migration count
- Schema drift incidents
- Database connection failures

---

## 🚨 CRITICAL UPDATE: Production Migration Incident (2025-09-05)

### THE GOLDEN RULE: Never Deploy with Pending Migrations

**INCIDENT SUMMARY**: Production deployment failed due to schema drift. Backend code had 3 pending migrations that were never applied to production database, causing:
- Folders API returning 500 errors (`folders.project_id` column missing)
- Seeding failures due to constraint violations
- Pipeline rules not loading (seeding incomplete)
- Only 2 users in production instead of expected 6

### MANDATORY PRE-DEPLOYMENT MIGRATION CHECK

**EVERY DEPLOYMENT MUST INCLUDE THIS CHECK:**

```bash
# 1. Check local migration status
cd apps/backend
npx prisma migrate status

# 2. Check production migration status (CRITICAL!)
export DATABASE_URL="$(az keyvault secret show --vault-name usasset-kv-yf2eqktewmxp2 --name database-connection-string --query value -o tsv)"
npx prisma migrate status

# Expected: "Database schema is up to date!"
# If pending migrations exist: STOP and apply them BEFORE deployment
npx prisma migrate deploy
```

### NEW DEVELOPER WORKFLOW: Immediate Production Sync

**When you create ANY migration, do this immediately:**

```bash
# 1. Create migration locally
npx prisma migrate dev --name "your_feature"

# 2. Test locally
npm run ci

# 3. Apply to production IMMEDIATELY (don't wait for deployment!)
export DATABASE_URL="$(az keyvault secret show --vault-name usasset-kv-yf2eqktewmxp2 --name database-connection-string --query value -o tsv)"

# Add temporary firewall rule if needed
MY_IP=$(curl -s https://api.ipify.org)
az postgres flexible-server firewall-rule create \
  --resource-group useng-usasset-api-rg \
  --name usasset-db-yf2eqktewmxp2-v2 \
  --rule-name temp-dev-access \
  --start-ip-address $MY_IP --end-ip-address $MY_IP

# Apply migration
npx prisma migrate deploy

# Clean up firewall rule
az postgres flexible-server firewall-rule delete \
  --resource-group useng-usasset-api-rg \
  --name usasset-db-yf2eqktewmxp2-v2 \
  --rule-name temp-dev-access --yes

# 4. Verify production is current
npx prisma migrate status  # Should show "up to date"
```

### Recovery Procedure for Failed Production Migrations

If a migration fails in production (like today's incident):

```bash
# 1. Access production database
MY_IP=$(curl -s https://api.ipify.org)
az postgres flexible-server firewall-rule create \
  --resource-group useng-usasset-api-rg \
  --name usasset-db-yf2eqktewmxp2-v2 \
  --rule-name temp-migration-fix \
  --start-ip-address $MY_IP --end-ip-address $MY_IP

export DATABASE_URL="$(az keyvault secret show --vault-name usasset-kv-yf2eqktewmxp2 --name database-connection-string --query value -o tsv)"

# 2. Check migration status
npx prisma migrate status

# 3. If migration failed, mark as rolled back
npx prisma migrate resolve --rolled-back "FAILED_MIGRATION_NAME"

# 4. Manually apply the migration SQL (from the migration file)
psql "$DATABASE_URL" < prisma/migrations/MIGRATION_NAME/migration.sql

# 5. Mark as applied
npx prisma migrate resolve --applied "MIGRATION_NAME"

# 6. Apply any remaining migrations
npx prisma migrate deploy

# 7. Clean up firewall rule
az postgres flexible-server firewall-rule delete \
  --resource-group useng-usasset-api-rg \
  --name usasset-db-yf2eqktewmxp2-v2 \
  --rule-name temp-migration-fix --yes
```

### Warning Signs of Migration Issues

🚨 **STOP DEPLOYMENT immediately if you see:**

- Seeding errors: `column "field_name" does not exist`
- API errors: 500 responses from previously working endpoints
- Constraint errors: `Unique constraint failed on the fields: (name)`
- Empty API responses: folders, users, or other core data missing
- Database connection timeouts during seeding

### Today's Specific Issues and Fixes

**Issue 1: Missing Migrations**
- Root cause: 3 migrations created locally but never applied to production
- Missing migrations: `add_asset_column_aliases`, `add_phase_result_tracking`, `fix_folders_and_files_schema`
- Fix: Applied migrations manually, then marked as applied

**Issue 2: Partial Migration Failure**
- Root cause: Migration partially applied (phase_results table created, but folders changes failed)
- Fix: Marked as rolled back, manually applied missing parts, marked as applied

**Issue 3: Incomplete Seeding**
- Root cause: Seeding failed at folders step due to constraint changes, pipeline rules never created
- Fix: Created missing pipeline rules via API

### Prevention Strategy

1. **Migration Status Check**: Now mandatory in deployment checklist
2. **Immediate Production Sync**: Apply migrations to prod when created, not during deployment
3. **Schema Validation**: Check API responses after any migration
4. **Seeding Verification**: Confirm all expected data exists after deployment

---

## Lessons Learned (Historical)

### Schema Drift Resolution
**Issue:** Folders table missing `project_id` field causing seed failures.

**Root Cause:** Database reset applied old migrations without recent schema changes.

**Solution:** Used `prisma db push` to sync schema after reset, then regenerated client.

**Prevention:** Always verify schema matches database after resets using `prisma migrate status`.

### TypeScript Integration
**Issue:** Missing enum imports causing compilation errors.

**Root Cause:** Removed enum from schema without updating dependent code.

**Solution:** Added missing `FileType` enum and related fields to maintain API compatibility.

**Prevention:** Run full build after schema changes to catch TypeScript errors early.

### Schema Drift from db push
**Issue:** Used `prisma db push` to fix drift but left migration history out of sync.

**Root Cause:** `db push` bypasses migration tracking, creating drift between migration files and database state.

**Solution Process:**
1. Database was already correct after `db push`
2. Created migration file manually in `prisma/migrations/TIMESTAMP_migration_name/migration.sql`
3. Marked migration as applied: `npx prisma migrate resolve --applied MIGRATION_NAME`
4. Cleaned up empty migration directories

**Key Insight:** When using `db push`, always document changes with proper migration afterward to maintain migration history integrity.

### Migration Lock Issues
**Issue:** Advisory lock timeouts during migration creation.

**Root Cause:** Stuck database connections or previous failed migrations holding locks.

**Solution:** Restart database container to clear all connections and locks.

**Command:** `docker-compose restart postgres` then retry migration.

---

*This SOP is a living document. Update it when new migration patterns or issues are discovered.*