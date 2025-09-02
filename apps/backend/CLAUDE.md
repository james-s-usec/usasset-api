<!--
  USAsset Backend API Documentation
  
  Purpose: NestJS backend configuration, architecture, and deployment guide
  Audience: Backend developers, DevOps engineers
  Last Updated: 2025-08-28
  Version: 2.1
  
  Key Sections:
  - Project Structure: Current codebase organization
  - Environment Setup: Local and production configuration
  - Database: Prisma ORM and PostgreSQL setup
  - Azure Deployment: Container Apps configuration
  - Architecture: Clean code principles and patterns
-->

# USAsset Backend

## ⚠️ CRITICAL: DO NOT MODIFY PACKAGE.JSON
**NEVER change package.json** without explicit user approval. This file contains:
- Carefully tested dependency versions
- CI/CD scripts that must not change
- Database scripts (Prisma migrations, seeds)
- Azure deployment configurations

If imports fail or dependencies seem missing, check:
1. tsconfig.json configuration
2. ESLint configuration
3. Module resolution settings
But DO NOT add dependencies to package.json!

## Overview
NestJS backend API configured for Azure Container Apps deployment with PostgreSQL database.

## Project Structure
```
src/
├── common/              # Shared services and utilities
│   ├── constants.ts
│   ├── database-logger.module.ts
│   ├── dto/             # Data transfer objects
│   ├── filters/         # Global exception filters
│   ├── interceptors/    # Request/response interceptors
│   ├── middleware/      # Custom middleware
│   └── services/        # Shared services
├── config/              # Configuration and validation
│   ├── config.factory.ts
│   ├── env.validation.ts
│   ├── env.validation.spec.ts
│   └── logger.config.ts
├── database/            # Database configuration
│   ├── database.module.ts
│   ├── interfaces/
│   └── prisma.service.ts
├── health/              # Health check endpoints
│   ├── health.controller.ts
│   ├── health.module.ts
│   ├── health.repository.ts
│   └── health.service.ts
├── logs/                # Logging endpoints
├── user/                # User management feature
│   ├── controllers/
│   ├── dto/
│   ├── interfaces/
│   ├── repositories/
│   └── services/
├── app.controller.ts    # Main app controller
├── app.module.ts        # Root module
├── app.service.ts       # Main app service
└── main.ts             # Application entry point
```

## Configuration

### Environment Variables
**Development** (.env file):
```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://dbadmin:password@localhost:5432/usasset
CORS_ORIGIN=http://localhost:5173
LOG_TO_FILE=false
```

**Production** (Azure Key Vault):
- `NODE_ENV=production` - Set in Container App
- `PORT` - Auto-set by Container Apps
- `DATABASE_URL` - From Key Vault: usasset-db-connection
- `CORS_ORIGIN` - Set in Container App config
- `JWT_SECRET` - From Key Vault: jwt-secret (REQUIRED)
- `API_KEY` - From Key Vault: api-key
- `LOG_TO_FILE=true` - Recommended for production

### Validation
- Joi schema validates all environment variables at startup
- Production requires: DATABASE_URL, JWT_SECRET
- Fails fast with clear error messages

### Logging
- Winston logger with NestJS integration
- Development: Colorized console output
- Production: JSON format for log aggregation
- Files: `logs/combined.log` and `logs/error.log`
- Never logs actual secrets (shows [SET]/[NOT SET])

## Available Scripts
```bash
npm run build           # Build for production
npm run start:dev       # Development server with hot reload
npm run start:dev:log   # Development with file logging
npm run start:prod      # Production server
npm run start:prod:log  # Production with file logging
npm run lint            # Run ESLint
npm run test            # Run unit tests
npm run test:e2e        # Run e2e tests
```

## Key Features
- ✅ NestJS ConfigModule with validation
- ✅ Azure Key Vault integration ready
- ✅ Health check endpoints (/health, /health/ready, /health/live)
- ✅ Comprehensive logging and debugging API (/logs)
- ✅ Request tracing with correlation IDs
- ✅ CORS configuration
- ✅ Winston file logging
- ✅ TypeScript with strict mode
- ✅ Jest testing setup
- ✅ ESLint configured
- ✅ Swagger/OpenAPI documentation (/api-docs)

## 📚 API Documentation (Swagger)

### **Interactive Documentation**
- **Swagger UI**: http://localhost:3000/api-docs
- **OpenAPI JSON**: http://localhost:3000/api-docs-json
- **CLI Access**: `./bin/usasset api-docs`

### **Available Documentation**
- All endpoints with descriptions
- Request/response schemas (DTOs)
- Parameter documentation
- Authentication requirements (when implemented)
- Try-it-out functionality in Swagger UI

### **Adding Documentation to New Endpoints**
```typescript
@ApiTags('feature-name')
@Controller('api/feature')
export class FeatureController {
  @Get()
  @ApiOperation({ summary: 'Get all features' })
  @ApiResponse({ status: 200, description: 'Success' })
  public async findAll() { }
}
```

## 🔍 Debugging & Logs API

### **Logs API Endpoints**
The backend provides comprehensive logging for debugging and monitoring:

```bash
# List recent logs (paginated)
GET /logs                           # Default: 50 most recent logs
GET /logs?page=2&limit=20           # Pagination controls
GET /logs?level=ERROR               # Filter by log level (ERROR, INFO, DEBUG, WARN)
GET /logs?correlationId=abc123      # Trace specific request by correlation ID

# Clear logs (use with caution)
DELETE /logs                        # Delete all log entries
```

### **Response Format**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid",
        "correlation_id": "abc123",
        "level": "ERROR",
        "message": "GET /api/invalid - 404 - Cannot GET /api/invalid",
        "metadata": {
          "url": "/api/invalid",
          "method": "GET", 
          "statusCode": 404,
          "stack": "Full error stack trace...",
          "userAgent": "curl/8.5.0",
          "ip": "::1"
        },
        "timestamp": "2025-09-01T21:33:47.643Z",
        "created_at": "2025-09-01T21:33:47.643Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1247,
      "totalPages": 25
    }
  }
}
```

### **What Gets Logged Automatically**
- ✅ **All HTTP requests** with response times
- ✅ **All errors** with full stack traces  
- ✅ **Validation errors** with field details
- ✅ **Database operations** (via Prisma query logging)
- ✅ **Request/response data** for debugging
- ✅ **Performance metrics** (response times, slow queries)
- ✅ **User agents and IP addresses**
- ✅ **Correlation IDs** for request tracing

### **Correlation ID Tracing**
Every request gets a unique correlation ID that appears in:
- Response headers: `x-correlation-id`
- All log entries for that request
- Error responses for easy tracing

Example workflow:
1. API call returns error with `correlationId: "abc123"`
2. Query logs: `GET /logs?correlationId=abc123`
3. See full request trace including all database queries

### **Common Debugging Queries**
```bash
# Find recent errors
curl "http://localhost:3000/logs?level=ERROR&limit=10"

# Trace a failed request
curl "http://localhost:3000/logs?correlationId=abc123"

# Monitor API performance (slow requests)
curl "http://localhost:3000/logs" | jq '.data.logs[] | select(.metadata.duration > 100)'

# Check validation errors
curl "http://localhost:3000/logs?level=ERROR" | jq '.data.logs[] | select(.message | contains("validation"))'
```

### **Development vs Production Logging**
- **Development**: Console output + database logging
- **Production**: JSON format + database + optional file logging
- **Never logs secrets** - shows `[SET]` or `[NOT SET]` instead
- **Structured metadata** for log aggregation tools

## Dependencies
- **Framework**: NestJS 11.x
- **Config**: @nestjs/config with Joi validation
- **Logging**: nest-winston, winston
- **Database**: Prisma (ready to connect)
- **Testing**: Jest

## Azure Deployment Notes
- Container Apps automatically injects Key Vault secrets as env vars
- Health checks configured for Container Apps probes
- Logs can be streamed to Azure Monitor
- PORT is automatically set by Container Apps

## Testing
```bash
npm test                        # All tests
npm test env.validation         # Config validation tests
npm run test:e2e -- config      # Config e2e tests
```

## Common Tasks

### Add a new module
```bash
nest g module feature-name
nest g controller feature-name
nest g service feature-name
```

### Check configuration
```bash
LOG_TO_FILE=true npm run start:dev
# Then check logs/combined.log for config output
```

### Validate environment
```bash
NODE_ENV=production npm run start:prod
# Will fail with clear message if required vars missing
```

## 🗄️ Database Schema Extension Guide

### Overview
USAsset uses **Prisma ORM** with PostgreSQL for database management. The schema is defined in `prisma/schema.prisma` with automatic TypeScript generation.

### Current Schema Structure
```
User model:
- id (UUID, primary key)
- email (unique, indexed)
- name (optional)
- role (USER | ADMIN | SUPER_ADMIN)
- Audit fields: created_at, updated_at, is_deleted, etc.

LogEntry model:
- id (UUID, primary key)
- timestamp, level, correlation_id (indexed)
- message, metadata (JSON)
```

### Adding New Tables/Models

#### 1. Define Schema
Edit `apps/backend/prisma/schema.prisma`:
```prisma
model Asset {
  id          String     @id @default(uuid())
  name        String
  description String?
  owner_id    String
  category    AssetCategory
  is_deleted  Boolean    @default(false)
  created_at  DateTime   @default(now())
  updated_at  DateTime   @updatedAt
  
  // Relations
  owner       User       @relation(fields: [owner_id], references: [id])
  
  // Indexes for performance
  @@index([category])
  @@index([owner_id])
  @@index([created_at])
  @@index([is_deleted])
  @@map("assets")
}

enum AssetCategory {
  HARDWARE
  SOFTWARE
  LICENSE
  FACILITY
}
```

#### 2. Generate Migration
```bash
cd apps/backend
npx prisma migrate dev --name add_assets_table
# This creates: prisma/migrations/TIMESTAMP_add_assets_table/migration.sql
```

#### 3. Update TypeScript Types
```bash
npx prisma generate  # Regenerates Prisma client types
```

#### 4. Create DTOs and Controllers
```bash
# Generate NestJS boilerplate
npx nest g module asset
npx nest g controller asset
npx nest g service asset

# Create DTOs in src/asset/dto/
# - create-asset.dto.ts
# - update-asset.dto.ts
# - asset-response.dto.ts
```

#### 5. Add Swagger Documentation
```typescript
// In asset.controller.ts
@ApiTags('assets')
@Controller('api/assets')
export class AssetController {
  @Get()
  @ApiOperation({ summary: 'Get all assets with pagination' })
  @ApiResponse({ status: 200, description: 'Assets retrieved successfully' })
  async findAll() { }
}
```

### Migration Commands Reference
```bash
# Development workflow
npx prisma migrate dev                    # Create and apply migration
npx prisma migrate dev --name feature    # Named migration
npx prisma db push                        # Push without migration (dev only)

# Production deployment
npx prisma migrate deploy                 # Apply pending migrations
npx prisma migrate status                 # Check migration status

# Database management
npx prisma db seed                        # Run seed data
npx prisma migrate reset                  # Reset database (dev only)
npx prisma studio                         # Open database GUI
```

### CLI Database Commands
The CLI provides database inspection commands:
```bash
./bin/usasset db:status      # Health check, migration count, table stats
./bin/usasset db:tables      # List all database tables
./bin/usasset db:migrations  # Show recent migrations
```

### Best Practices for Schema Extensions

#### 1. Always Use Migrations
- Never modify database directly in production
- Always generate migrations with descriptive names
- Test migrations on staging before production

#### 2. Indexing Strategy
```prisma
// Always index:
@@index([foreign_key_fields])  # Foreign keys
@@index([query_filter_fields])  # WHERE clause fields
@@index([sort_fields])          # ORDER BY fields
@@index([is_deleted])           # Soft delete flag
```

#### 3. Audit Trail Pattern
```prisma
model YourModel {
  // ... your fields
  
  // Audit trail (copy from User model)
  is_deleted Boolean  @default(false)
  created_at DateTime @default(now())
  created_by String?
  updated_at DateTime @updatedAt
  updated_by String?
  deleted_at DateTime?
  deleted_by String?
}
```

#### 4. Naming Conventions
- Models: PascalCase singular (`User`, `Asset`, `LogEntry`)
- Fields: snake_case (`created_at`, `owner_id`)
- Tables: snake_case plural (`@@map("users")`, `@@map("assets")`)
- Enums: SCREAMING_SNAKE_CASE values (`USER`, `ADMIN`)

### Deployment Integration
Schema changes are automatically deployed via:
```bash
# Azure deployment (from scripts/azure-deploy.sh)
npx prisma migrate deploy  # Apply pending migrations
npm run start:prod         # Start application

# Docker deployment (from docker-entrypoint.sh)  
npx prisma migrate deploy  # Apply pending migrations in container
```

### Troubleshooting Common Issues

#### Migration Conflicts
```bash
# If migration conflicts occur:
npx prisma migrate resolve --applied MIGRATION_NAME  # Mark as applied
npx prisma migrate resolve --rolled-back MIGRATION_NAME  # Mark as rolled back
```

#### Schema Drift
```bash
npx prisma db pull          # Pull current DB schema
npx prisma migrate diff     # Compare schema vs migrations
```

#### Type Generation Issues
```bash
npx prisma generate --force-update  # Force regenerate types
rm -rf node_modules/.prisma         # Clear Prisma cache
npm run build                       # Rebuild application
```

This guide ensures consistent database evolution following the project's clean architecture principles while maintaining type safety and deployment automation.

## 🎯 User Feature MVP Blueprint (YAGNI Implementation Guide)

### Purpose
The User feature serves as a **production-ready reference implementation** for all future features. It demonstrates the bare minimum patterns needed for production without over-engineering.

### YAGNI Principles Applied
- ✅ **You Aren't Gonna Need It** - Only implement what's required for production
- ✅ **Minimal Viable Patterns** - Essential security and error handling only
- ✅ **Reference Implementation** - Copy these patterns for new features

### Core Production Patterns (Bare Minimum)

#### 1. Input Sanitization Pattern
```typescript
// File: src/common/pipes/sanitization.pipe.ts
@Injectable()
export class SanitizationPipe implements PipeTransform {
  transform(value: any): any {
    if (typeof value === 'string') {
      return value.trim().replace(/[<>]/g, ''); // Basic XSS protection
    }
    return value;
  }
}

// Usage in controllers:
@Post()
async create(@Body(SanitizationPipe, ValidationPipe) dto: CreateUserDto) {}
```

#### 2. Database Pagination Pattern
```typescript
// File: src/user/services/user-query.service.ts
async findManyPaginated(page: number, limit: number) {
  const skip = (page - 1) * limit;
  return this.prisma.user.findMany({
    skip,
    take: limit,
    where: { is_deleted: false },
    orderBy: { created_at: 'desc' }
  });
}
```

#### 3. Standardized Error Pattern
```typescript
// File: src/common/exceptions/user.exceptions.ts
export class UserNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`User with ID ${id} not found`);
  }
}

// Usage:
if (!user) throw new UserNotFoundException(id);
```

#### 4. Sensitive Data Filter Pattern
```typescript
// File: src/user/dto/safe-user.dto.ts
export class SafeUserDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: Date;
  // Excludes: updated_by, deleted_by, etc.
}

// Usage in services:
return plainToInstance(SafeUserDto, user, { excludeExtraneousValues: true });
```

### Implementation Checklist (Copy for New Features)

#### Phase 1: Core Security (Required)
- [ ] Add sanitization pipe to all POST/PATCH endpoints
- [ ] Create specific exception classes for domain errors
- [ ] Implement safe DTO responses (exclude sensitive fields)
- [ ] Add database-level pagination (never load all records)

#### Phase 2: Search & Filter (If Needed)
- [ ] Add search by indexed fields only
- [ ] Use database WHERE clauses, not in-memory filtering
- [ ] Add sorting by indexed fields

#### Phase 3: Enhanced Error Handling (If Complex)
- [ ] Custom exception filter for domain-specific errors
- [ ] Structured error responses with correlation IDs

### File Structure Template
```
src/feature-name/
├── controllers/
│   └── feature.controller.ts     # HTTP only, use pipes
├── services/
│   ├── feature-query.service.ts  # Read operations with pagination
│   └── feature-command.service.ts # Write operations
├── dto/
│   ├── create-feature.dto.ts     # Input validation
│   ├── safe-feature.dto.ts       # Output sanitization
│   └── feature-search.dto.ts     # Search parameters
├── exceptions/
│   └── feature.exceptions.ts     # Domain-specific errors
└── feature.module.ts
```

### What NOT to Implement (YAGNI)
- ❌ Authentication (separate infrastructure concern)
- ❌ Rate limiting (nginx/infrastructure)
- ❌ Caching (add when performance issues proven)
- ❌ Complex authorization (start with role enum)
- ❌ Audit logging (add when compliance required)

### Documentation Rule
Every new feature MUST:
1. Copy these patterns exactly
2. Add feature-specific exceptions to this list
3. Update the checklist with lessons learned
4. Keep it minimal - resist feature creep

### Lessons Learned from User Feature Implementation

#### Key Patterns That Work Well
1. **Sanitization Pipe**
   - Place pipes in order: `@Body(SanitizationPipe, ValidationPipe)`
   - Keep sanitization simple - just trim and remove angle brackets
   - TypeScript: Use `unknown` type instead of `any` for pipe parameters

2. **Database Pagination**
   - Always use Prisma's `skip/take` at database level
   - Run count query in parallel with data query using `Promise.all`
   - Add `orderBy` for consistent pagination results
   - Include `where: { is_deleted: false }` by default

3. **Exception Handling**
   - One exception class per file (ESLint rule)
   - Always add `public` modifier to constructors
   - Import specific exceptions, not base classes in controllers
   - Replace generic exceptions with domain-specific ones

4. **Safe Response DTOs**
   - Use `!` for DTO properties to satisfy TypeScript strict mode
   - Use `plainToInstance` with `excludeExtraneousValues: true`
   - Transform to DTOs in controller, not service (separation of concerns)
   - Always document excluded fields in comments

#### Common ESLint/TypeScript Gotchas
- `max-classes-per-file`: Split exception classes into separate files
- `@typescript-eslint/explicit-member-accessibility`: Add `public` to all methods
- `@typescript-eslint/no-explicit-any`: Use `unknown` instead
- `@typescript-eslint/no-unused-vars`: Remove unused parameters or imports immediately
- DTO properties need `!` suffix for TypeScript strict initialization

#### Implementation Order That Works
1. Create files first (pipes, exceptions, DTOs)
2. Update imports in controller
3. Apply changes methodically (one endpoint at a time)
4. Run `npm run ci` frequently to catch issues early
5. Fix lint errors before moving to next task

This blueprint ensures consistency while following "you aren't gonna need it" principles.