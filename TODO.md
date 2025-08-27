# TODO: USAsset Development Tasks

## 🚨 Priority 0: CLI Commander Tool
**Goal**: Create a unified CLI tool to replace individual scripts

### CLI Commander Tasks
- [ ] Create main `usasset` CLI script in root directory
- [ ] Implement command structure:
  - [ ] `usasset deploy` - Azure deployment options (backend/frontend/both)
  - [ ] `usasset dev` - Local development options (start/stop/logs)
  - [ ] `usasset test` - Run tests with output to logs:
    - `usasset test unit` - Unit tests (Jest)
    - `usasset test e2e` - E2E tests
    - `usasset test health` - Health check tests
    - `usasset test coverage` - Test coverage report
    - `usasset test watch` - Watch mode for TDD
  - [ ] `usasset db` - Database operations (migrate/seed/connect)
  - [ ] `usasset logs` - View/tail various log files:
    - `usasset logs azure` - Latest Azure deployment log
    - `usasset logs dev` - Latest local dev log
    - `usasset logs test` - Latest test run log
    - `usasset logs clean` - Clean old log files
  - [ ] `usasset lint` - Run linting with log output (backend/frontend/both/fix)
  - [ ] `usasset build` - Build projects with log output (backend/frontend/both/docker)
  - [ ] `usasset typecheck` - Run TypeScript type checking with log output
  - [ ] `usasset format` - Run code formatting (prettier)
  - [ ] `usasset clean` - Clean build artifacts and node_modules
  - [ ] `usasset install` - Install dependencies (npm/specific packages)
  - [ ] `usasset help` - Show all available commands
- [ ] All commands output to timestamped log files in `.logs/`
- [ ] Add `--verbose` flag for detailed output
- [ ] Add `--no-log` flag to skip logging
- [ ] Add interactive menu when no command provided
- [ ] Color-coded output and progress indicators
- [ ] Automatic path resolution (works from any directory)
- [ ] Command aliases for common operations (e.g., `usasset l` for lint, `usasset t` for test)
- [ ] Tab completion support (optional)
- [ ] Update all documentation to use new CLI

## 🚨 Priority 1: Health Module & E2E Testing
**Goal**: Get frontend-backend communication verified with proper health checks

### Backend Tasks
- [ ] Generate proper NestJS health module: `nest g module health`
- [ ] Add health controller with endpoints:
  - [ ] `/health` - Basic health check
  - [ ] `/health/db` - Database connectivity check  
  - [ ] `/health/ready` - Readiness probe for Azure
  - [ ] `/health/live` - Liveness probe for Azure
- [ ] Implement actual Prisma database health check (not mock)
- [ ] Add health module tests
- [ ] Configure proper CORS for production URLs

### Frontend Tasks  
- [ ] Add API health check on app load
- [ ] Display connection status indicator
- [ ] Add retry logic for failed backend calls
- [ ] Environment variable validation on startup

### Deployment & Testing
- [ ] Deploy updated backend to Azure with health endpoints
- [ ] Run `health-check.sh azure` to verify all endpoints
- [ ] Test CORS between Azure frontend and backend
- [ ] Verify database connectivity from Azure backend
- [ ] Document any Azure Container App health probe configuration needed

### E2E Testing Setup
- [ ] Add more comprehensive E2E tests to `health-check.sh`:
  - [ ] Test data flow (create, read, update, delete)
  - [ ] Test error handling
  - [ ] Test performance metrics
  - [ ] Test authentication flow (when implemented)
- [ ] Create GitHub Action for automated health checks
- [ ] Add monitoring/alerting for failed health checks

---

## Priority 2: Authentication & Authorization
- [ ] Add JWT authentication module
- [ ] User registration/login endpoints
- [ ] Protected route examples
- [ ] Role-based access control (RBAC)
- [ ] Session management

## Priority 3: Data Models & API
- [ ] Define Prisma schema for core entities
- [ ] Generate CRUD endpoints for main resources
- [ ] Add validation pipes
- [ ] Implement pagination
- [ ] Add API documentation (Swagger)

## Priority 4: Frontend Features
- [ ] Implement routing structure
- [ ] Add authentication UI
- [ ] Create dashboard layout
- [ ] Build main feature components
- [ ] Add state management (if needed)

## Priority 5: Production Readiness
- [ ] Add comprehensive logging
- [ ] Implement error tracking (Sentry?)
- [ ] Performance monitoring
- [ ] Security headers
- [ ] Rate limiting
- [ ] API versioning
- [ ] Backup strategies

## Priority 6: DevOps & CI/CD
- [ ] GitHub Actions for CI/CD
- [ ] Automated testing pipeline
- [ ] Staging environment setup
- [ ] Blue-green deployment strategy
- [ ] Rollback procedures

## Notes
- Always run `health-check.sh` after deployments
- Update `.env.example` files when adding new variables
- Keep `AZURE-COMPLETE-GUIDE.md` updated with any infrastructure changes
- Test locally with `./local-dev.sh` before deploying to Azure

## Quick Commands Reference
```bash
# Deploy to Azure
./update-azure.sh

# Check health
./health-check.sh        # Local
./health-check.sh azure  # Azure

# Local development
./local-dev.sh

# View logs
ls -lt .logs/*.log | head -5
```

---
*Last Updated: 2025-08-27*