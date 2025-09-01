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