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

## ✅ Priority 1: Database Setup with User Entity [COMPLETED]
**Goal**: Get Prisma working with Azure PostgreSQL and create User entity

### Database Setup Tasks
- [x] Initialize Prisma in backend: `npx prisma init`
- [x] Configure DATABASE_URL for Azure PostgreSQL
- [x] Create User entity schema in `schema.prisma`:
  - [x] id (UUID)
  - [x] email (unique)
  - [x] name
  - [x] createdAt
  - [x] updatedAt
  - [x] Additional fields: role, soft delete, audit fields
- [x] Generate Prisma client: `npx prisma generate`
- [x] Create initial migration: `npx prisma migrate dev --name init`
- [x] Test migration locally with Docker PostgreSQL
- [x] Deploy migration to Azure database: `npx prisma migrate deploy`
- [x] Create user module: `nest g module users`
- [x] Create user service with CRUD operations
- [x] Create user controller with endpoints
- [ ] Test user creation/retrieval from Azure (needs testing)
- [x] Update health check to use real Prisma database check

## ✅ Priority 2: Health Module & E2E Testing [MOSTLY COMPLETED]
**Goal**: Get frontend-backend communication verified with proper health checks

### Backend Tasks (AFTER database is working)
- [x] Generate proper NestJS health module: `nest g module health`
- [x] Add health controller with endpoints:
  - [x] `/health` - Basic health check
  - [x] `/health/db` - Database connectivity check (using Prisma)
  - [x] `/health/ready` - Readiness probe for Azure
  - [x] `/health/live` - Liveness probe for Azure
- [x] Implement actual Prisma database health check (not mock)
- [ ] Add health module tests (NO TESTS EXIST YET - needs unit tests for health.service.spec.ts)
- [x] Configure proper CORS for production URLs

### Frontend Tasks  
- [x] Add API health check on app load (DbStatus component)
- [x] Display connection status indicator
- [ ] Add retry logic for failed backend calls
- [ ] Environment variable validation on startup

### Deployment & Testing
- [x] Deploy updated backend to Azure with health endpoints (ALREADY DEPLOYED)
- [ ] Run `health-check.sh azure` to verify all endpoints (script may need updating)
- [x] Test CORS between Azure frontend and backend (CORS configured, needs live test)
- [x] Verify database connectivity from Azure backend (working locally with Docker)
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

## Priority 3: Authentication & Authorization
- [ ] Add JWT authentication module
- [ ] User registration/login endpoints
- [ ] Protected route examples
- [ ] Role-based access control (RBAC)
- [ ] Session management

## Priority 4: Extended Data Models & API
- [ ] Define Prisma schema for additional entities (beyond User)
- [ ] Generate CRUD endpoints for main resources
- [ ] Add validation pipes
- [ ] Implement pagination
- [ ] Add API documentation (Swagger)

## 🎯 Priority 3.5: Simple Material UI Frontend [NEW]
**Goal**: Create a simple frontend with splash page, user table, and login form using Material UI v5

### Setup Tasks
- [ ] Install Material UI and dependencies:
  ```bash
  npm install @mui/material @emotion/react @emotion/styled --workspace=frontend
  npm install @mui/icons-material --workspace=frontend
  npm install react-router-dom --workspace=frontend
  ```
- [ ] Set up Material UI theme provider in main.tsx
- [ ] Configure routing with React Router

### Splash Page
- [ ] Create SplashPage component with:
  - [ ] Hero section with app title and tagline
  - [ ] Simple feature cards (using Material UI Card)
  - [ ] Navigation buttons to Login and Users
  - [ ] Use Material UI Typography, Button, Container

### User Table Page  
- [ ] Create UsersPage component with:
  - [ ] Material UI DataGrid or Table component
  - [ ] Fetch users from backend API
  - [ ] Display columns: Name, Email, Role, Created Date
  - [ ] Add search/filter functionality
  - [ ] Pagination support
  - [ ] Loading and error states

### Login Form Page
- [ ] Create LoginPage component with:
  - [ ] Material UI TextField for email
  - [ ] Material UI TextField for password (type="password")
  - [ ] Material UI Button for submit
  - [ ] Form validation feedback
  - [ ] Loading state during login
  - [ ] Error message display
  - [ ] Link to "Forgot Password" (placeholder)

### Navigation & Layout
- [ ] Create AppLayout component with:
  - [ ] Material UI AppBar with navigation
  - [ ] Drawer/Sidebar for navigation (optional)
  - [ ] Responsive design with Material UI Grid/Container
- [ ] Implement protected routes (redirect to login if not authenticated)

### State Management
- [ ] Use React Context for authentication state
- [ ] Store JWT token in localStorage/sessionStorage
- [ ] Add axios interceptor for auth headers

## Priority 4: Extended Frontend Features
- [ ] Add more complex forms and validation
- [ ] Implement data visualization/charts
- [ ] Add real-time features (websockets)
- [ ] Progressive Web App features
- [ ] Internationalization (i18n)

## Priority 5: Production Readiness
- [ ] Add comprehensive logging
- [ ] Implement error tracking (Sentry?)
- [ ] Performance monitoring
- [ ] Security headers
- [ ] Rate limiting
- [ ] API versioning
- [ ] Backup strategies

## Priority 6: DevOps & CI/CD [PARTIALLY COMPLETED]
- [x] GitHub Actions for CI (basic - lint, typecheck, test, build)
- [x] Automated testing pipeline
- [x] Docker setup for local development (mirrors Azure)
- [ ] Staging environment setup
- [ ] Blue-green deployment strategy
- [ ] Rollback procedures

## Recent Completions (2025-08-28)
- ✅ Fixed frontend tests with proper mocking
- ✅ Set up GitHub Actions CI pipeline
- ✅ Configured Docker Compose for local development
- ✅ Verified CORS configuration working
- ✅ Database connectivity with Prisma established
- ✅ User CRUD operations implemented
- ✅ Health checks with real database connection

## Notes
- Always run `health-check.sh` after deployments
- Update `.env.example` files when adding new variables
- Keep `AZURE-COMPLETE-GUIDE.md` updated with any infrastructure changes
- Test locally with Docker Compose before deploying to Azure
- CI runs automatically on push/PR to main

## Quick Commands Reference
```bash
# Deploy to Azure
./update-azure.sh

# Local Docker development
docker-compose up -d      # Start all services
docker-compose logs -f    # View logs
docker-compose down       # Stop services

# Run tests
npm run ci               # Full CI locally
npm run test             # Run all tests

# Check health
curl http://localhost:3000/health       # Local backend
curl http://localhost:3000/health/db    # Local database

# View logs
ls -lt .logs/*.log | head -5
```

---
*Last Updated: 2025-08-28*