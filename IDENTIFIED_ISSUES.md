# Identified Issues - Project Feature Testing

## 1. Frontend-Backend Integration Issues

### Issue: Project Creation Fails with 400 Bad Request
**Root Cause**: Frontend sends `owner_id: '00000000-0000-0000-0000-000000000000'` which doesn't exist in database
**Location**: `/apps/frontend/src/pages/ProjectsPage.tsx:6`
**Error**: 
```
BadRequestException: Bad Request Exception
ValidationPipe.exceptionFactory
```
**Fix Required**: 
- Option 1: Create a test user with this UUID in database seed
- Option 2: Implement proper auth system to get real user ID
- Option 3: Make owner_id optional and use a default system user

### Issue: No Real Authentication System
**Impact**: Using hardcoded mock user ID throughout frontend
**Files Affected**:
- `/apps/frontend/src/pages/ProjectsPage.tsx` - CURRENT_USER_ID constant
- All project operations require valid user IDs

## 2. CLI Tool Issues

### Issue: Working Directory Assumptions
**Problem**: CLI commands fail when run from root directory
**Example**: `cd apps/cli && ./bin/usasset` fails with "no such file or directory"
**Fix**: Use absolute paths or properly handle working directory

### Issue: Missing Database Query Command
**Problem**: No direct SQL query command in CLI
**Attempted**: `./bin/usasset db:query` - doesn't exist
**Available**: Only `db:status`, `db:tables`, `db:migrations`
**Fix**: Add db:query command for debugging

## 3. Testing Infrastructure

### Issue: No Comprehensive Test Suite
**Problem**: No curl/bash script for end-to-end API testing
**Impact**: Manual testing required for each endpoint
**Need**: Tracer bullet test script that:
- Creates test data
- Tests all CRUD operations
- Verifies request/response formats
- Tests error conditions

### Issue: No Test Data Seeding
**Problem**: Database has no test users or projects
**Impact**: Can't test features without manual data creation
**Fix**: Create seed script with:
- Test users including UUID '00000000-0000-0000-0000-000000000000'
- Sample projects
- Project memberships

## 4. Docker/Database Access

### Issue: TTY Required for Docker Commands
**Problem**: `docker exec -it` fails in non-interactive environments
**Example**: `docker exec -it usasset-postgres psql` fails with "input device is not a TTY"
**Fix**: Remove `-it` flags or use CLI tool instead

## 5. Validation & Error Messages

### Issue: Generic Validation Errors
**Problem**: Backend returns "Bad Request Exception" without field details
**Expected**: Should return which fields failed validation and why
**Example**: Missing "owner_id is required" or "owner_id must be valid UUID"

## 6. Development Workflow

### Issue: npm run dev Output Overwhelming
**Problem**: Prisma query logs flood console making debugging difficult
**Output**: Thousands of INSERT INTO log_entries queries
**Fix**: Add environment flag to disable query logging in development

## Quick Fixes Needed

1. **Immediate**: Insert test user with mock UUID
```sql
INSERT INTO users (id, email, name, role, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com', 'Test User', 'USER', NOW(), NOW());
```

2. **Short-term**: Create test script
```bash
#!/bin/bash
# test-projects.sh
# Test all project endpoints with curl
```

3. **Medium-term**: Implement basic auth with JWT tokens

## Commands That Should Work But Don't

1. `./bin/usasset db:query "SELECT * FROM users"` - doesn't exist
2. `npm run test:api` - no API test script
3. `npm run seed` - no seed script

## Next Steps

1. Create test user in database
2. Write comprehensive test script
3. Fix validation error messages
4. Add proper authentication
5. Improve CLI tool paths