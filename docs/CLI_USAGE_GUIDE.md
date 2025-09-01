<!--
  USAsset CLI Usage Guide
  
  Purpose: Complete usage reference for CLI commands and CI integration
  Audience: Developers, DevOps engineers
  Last Updated: 2025-09-01
  Version: 1.0
  
  Quick Reference: Essential commands and workflow patterns
-->

# USAsset CLI Usage Guide

## Quick Reference

### CI Pipeline (from project root)
```bash
npm run ci                    # Full pipeline: lint → typecheck → test → build → summary
npm run lint                  # ESLint all workspaces (backend, frontend, cli)
npm run typecheck            # TypeScript validation (all workspaces)  
npm run test                 # Jest/Vitest tests (all workspaces)
npm run build                # Build all workspaces to dist/
```

### CLI Commands (after build)
```bash
cd apps/cli
npm run build                # Build CLI first (required)
./bin/usasset start          # Start backend with health check
./bin/usasset health         # Check /health endpoint status
./bin/usasset status         # Show process PID and status  
./bin/usasset stop           # Graceful shutdown (SIGTERM)
```

## Workflow Patterns

### Development Workflow
```bash
# 1. Quality gates first
npm run ci                   # Verify all quality gates pass

# 2. Build CLI
cd apps/cli && npm run build

# 3. Start backend
./bin/usasset start          # Spawns backend, waits for health

# 4. Develop/test
./bin/usasset status         # Check process status
./bin/usasset health         # Verify API health

# 5. Clean shutdown  
./bin/usasset stop           # Graceful SIGTERM
```

### CI/CD Integration
```bash
# All workspaces run in parallel
npm run lint      # backend + frontend + cli (parallel)
npm run typecheck # backend + frontend + cli (parallel)
npm run test      # backend + frontend + cli (parallel)
npm run build     # backend + frontend + cli (parallel)

# Results logged to .logs/
ls -lt .logs/*.log           # View recent logs
tail -f .logs/cli-lint.log   # Follow CLI specific logs
```

### Troubleshooting Commands
```bash
# Check CLI build status
cd apps/cli && npm run build

# Check backend process
./bin/usasset status         # Shows PID if running
ps aux | grep node           # System process list

# Check health endpoint
curl http://localhost:3000/health
./bin/usasset health         # CLI health check

# Check logs
ls -lt .logs/cli_*.log       # CLI operation logs
docker logs usasset-postgres # Database logs (if using Docker)
```

## Command Examples

### Starting Backend
```bash
./bin/usasset start
# Output:
# 🚀 Starting USAsset backend...
# ✅ Backend started with PID: 12345
# 🔍 Waiting for backend to be ready...
# 🎉 Backend is ready and healthy!
```

### Checking Status
```bash
./bin/usasset status
# Output (running): ✅ Backend is running (PID: 12345)
# Output (stopped): ⭕ Backend is not running
```

### Health Check
```bash
./bin/usasset health
# Output (healthy): ✅ Backend is healthy
# Output (unhealthy): ❌ Backend is not healthy (exits with code 1)
```

### Stopping Backend
```bash
./bin/usasset stop
# Output (success): 🛑 Stopping USAsset backend...
#                   ✅ Backend stopped successfully
# Output (not running): ⚠️  No backend process found to stop
```

## Architecture Integration

### Monorepo Workspace Structure
```
apps/cli/                    # CLI workspace
├── package.json            # CLI-specific dependencies
├── CLAUDE.md              # Complete implementation guide
├── src/lib/               # Utility classes (ProcessManager, HealthChecker, Logger)
└── bin/usasset           # Executable binary

Root integration:
├── package.json           # Includes CLI in all workspace scripts
├── CLAUDE.md             # References CLI documentation
└── docs/CLI_USAGE_GUIDE.md  # This file
```

### Quality Gates Integration
- **ESLint**: CLI follows same strict rules as backend/frontend
- **TypeScript**: CLI uses strict mode with proper type safety
- **Testing**: CLI passes with `jest --passWithNoTests`
- **Build**: CLI compiles TypeScript to JavaScript in dist/

### CLAUDE.md Compliance
- ✅ One thing per file (ProcessManager, HealthChecker, Logger separate)
- ✅ Feature boundaries sacred (CLI isolated workspace, zero coupling)
- ✅ Simple data flow (CLI → ProcessManager → spawn() → Backend)
- ✅ Complexity budget (each class ≤5 methods, ≤30 lines per method)
- ✅ No clever code (explicit process management, boring HTTP checks)
- ✅ Dependencies shallow (commander, cross-spawn, axios, chalk only)

## Error Scenarios

### Build Errors
```bash
# Problem: TypeScript compilation errors
cd apps/cli && npm run build
# Solution: Fix TypeScript errors, run npm run typecheck first

# Problem: "command not found: usasset"
# Solution: Ensure build completed and bin/usasset is executable
chmod +x bin/usasset
```

### Runtime Errors  
```bash
# Problem: "Backend already running"
./bin/usasset status         # Check current status
./bin/usasset stop          # Stop existing process

# Problem: "Health check timeout"  
# Solution: Check backend dependencies (database, environment)
docker-compose up -d         # Start local PostgreSQL
```

### CI/CD Errors
```bash
# Problem: CLI tests failing in CI
npm run test --workspace=cli # Check CLI-specific test results
cat .logs/cli-test.log      # Review test log output

# Problem: CLI lint errors
npm run lint --workspace=cli # Check CLI-specific lint results  
cat .logs/cli-lint.log      # Review lint error details
```

## Integration Points

### Backend Integration
- **Process spawning**: `npm run start:dev` in apps/backend directory
- **Health endpoint**: GET http://localhost:3000/health  
- **Graceful shutdown**: SIGTERM signal with 10s timeout protection
- **Logging**: Backend logs graceful shutdown messages

### CI Pipeline Integration  
- **Parallel execution**: CLI runs alongside backend/frontend in all scripts
- **Log aggregation**: All results saved to .logs/ directory
- **Quality gate enforcement**: CI fails if any workspace fails
- **Summary reporting**: check-ci.js validates all workspace results

### Development Environment
- **Zero coupling**: CLI works independently of backend/frontend code
- **Docker integration**: Works with docker-compose PostgreSQL
- **Local development**: Integrates with existing npm run dev workflow
- **Process management**: Tracks PIDs, handles clean shutdowns

This usage guide provides complete reference for CLI operations while maintaining architectural compliance with all CLAUDE.md principles.