<!--
  USAsset CLI - Implementation Documentation
  
  Purpose: CLI tool for managing USAsset backend processes with zero coupling
  Audience: Developers, DevOps engineers
  Last Updated: 2025-09-01
  Version: 1.0
  
  Architecture: External process spawning with graceful shutdown integration
  Quality Gates: ESLint strict, TypeScript strict, CI/CD integrated
-->

# USAsset CLI

## Overview
Zero-coupling CLI tool for managing USAsset backend processes through external process spawning.

## Architecture Compliance

### CLAUDE.md Rules Followed
✅ **One Thing Per File Rule**:
- `ProcessManager` - only handles process lifecycle
- `HealthChecker` - only handles HTTP health checks  
- `CliLogger` - only handles logging operations
- `index.ts` - only handles command routing

✅ **Feature Boundaries Sacred**:
- CLI exists as isolated workspace
- No direct imports from backend/frontend
- Uses HTTP endpoints and process spawning only
- Zero coupling with backend business logic

✅ **Simple Data Flow**:
```
CLI Command → ProcessManager → spawn() → Backend Process
                ↓
CLI Response ← HealthChecker ← HTTP Health ← Backend API
```

✅ **Complexity Budget**:
- ProcessManager: 4 methods (spawnBackend, stopBackend, getBackendPid, isBackendRunning)
- HealthChecker: 2 methods (checkHealth, waitForHealth)  
- CliLogger: 4 methods (info, success, warn, error)
- All methods ≤20 lines, classes ≤70 lines

✅ **No Clever Code**:
- Explicit process management with PID tracking
- Simple HTTP health checks with axios
- Boring logging to console + files
- Copy-paste TypeScript patterns from backend

✅ **Dependencies Stay Shallow**:
- CLI depends only on: commander, cross-spawn, axios, chalk
- Core logic has zero external dependencies
- Backend interface only through HTTP + process spawning

## Quick Start

### Installation & Build
```bash
cd apps/cli
npm install                  # Install CLI dependencies
npm run build               # Compile TypeScript
```

### Available Commands

#### Process Management
```bash
./bin/usasset start         # Start backend with health check
./bin/usasset stop          # Gracefully stop backend (SIGTERM)
./bin/usasset health        # Check backend /health endpoint
./bin/usasset status        # Show process status and PID
```

#### Logs & Debugging
```bash
./bin/usasset logs list               # List recent logs (default: 10)
./bin/usasset logs list --limit 50    # Show more logs
./bin/usasset logs list --level ERROR # Filter by log level
./bin/usasset logs errors              # Show recent errors with stack traces
./bin/usasset logs errors --limit 20  # Show more errors
./bin/usasset logs trace <id>         # Trace request by correlation ID
```

#### API Documentation
```bash
./bin/usasset api-docs                # Show API endpoint summary
./bin/usasset api-docs detailed       # Show full API documentation with DTOs
./bin/usasset api-docs json           # Export raw OpenAPI spec as JSON
```

**Enhanced Debugging with logs trace:**
The `logs trace` command now displays comprehensive request/response data:
- 📨 Request Headers (excluding Authorization)
- 📥 Request Body (full JSON payload)
- 📤 Response Data (full JSON response)
- 📜 Stack Traces for errors
- ⏱️ Request timing and status codes

Example output:
```
./bin/usasset logs trace 87c6326c-00a9-4cb4-93c6-299f1afa2a29

🔍 Request Trace for 87c6326c-00a9-4cb4-93c6-299f1afa2a29:
1. [9/1/2025, 4:36:34 PM] ℹ️
   POST /api/users - 201 - 6ms
   📍 POST /api/users
   📊 Status: 201
   ⏱️  Duration: 6ms
   📨 Request Headers:
      host: localhost:3000
      user-agent: curl/8.5.0
      content-type: application/json
   📥 Request Body:
      {
        "name": "Debug Test",
        "email": "debug@test.com"
      }
   📤 Response Data:
      {
        "id": "aa78eaeb-bfc8-4e15-ad7e-6c4cf1fb84e5",
        "email": "debug@test.com",
        "name": "Debug Test",
        ...
      }
```

### Development Commands
```bash
npm run dev                 # Run with ts-node
npm run lint                # ESLint with --fix
npm run typecheck           # TypeScript validation
npm run test                # Jest (passes with no tests)
npm run build               # Compile to dist/
```

## Implementation Details

### Process Management Strategy
- Uses `cross-spawn` for cross-platform process creation  
- **Persistent PID tracking** via `.usasset.pid` file (standard Unix pattern)
- Sends SIGTERM for graceful shutdown (10s timeout in backend main.ts)
- Process spawning in `apps/backend` directory with `npm run start:dev`

**✅ Cross-Session Process Management**: PID tracking persists across different CLI sessions using standard Unix `.pid` file pattern. Start the backend in one terminal, check status or stop from any other terminal session. PID file is automatically cleaned up on graceful shutdown.

### Health Check Integration  
- Polls `http://localhost:3000/health` endpoint
- 30-second timeout with 1-second intervals
- Returns structured health status from NestJS backend
- Used by `start` command to verify backend readiness

### Logging Strategy
- Console output for user feedback with emojis/colors
- File logging to `.logs/cli_TIMESTAMP.log` 
- Follows existing monorepo `.logs/` pattern
- Structured logging levels: INFO, SUCCESS, WARN, ERROR

### CI/CD Integration
CLI is fully integrated into monorepo quality gates:

**Root package.json scripts include CLI:**
```bash
npm run lint      # → cli, backend, frontend in parallel
npm run typecheck # → cli, backend, frontend in parallel  
npm run test      # → cli, backend, frontend in parallel
npm run build     # → cli, backend, frontend in parallel
```

**Quality Gate Results:**
- ✅ ESLint: 0 errors (strict rules enforced)
- ✅ TypeScript: 0 errors (strict mode)
- ✅ Tests: Pass with no tests (jest --passWithNoTests)  
- ✅ Build: Compiles successfully to dist/

## TypeScript Configuration

### Key Type Safety Fixes
```typescript
// Fixed: Proper ChildProcess import from node:child_process (not cross-spawn)
import type { ChildProcess } from "node:child_process";

// Fixed: Explicit type annotations for Map.get() operations
const backendProcess: ChildProcess | undefined = this.processes.get("backend");
```

### ESLint Configuration  
Matches backend strict rules:
- `@typescript-eslint/no-unsafe-assignment` 
- `@typescript-eslint/no-unsafe-call`
- `@typescript-eslint/no-unsafe-member-access`
- Complexity max 7, max 30 lines per function

## File Structure
```
apps/cli/
├── package.json           # CLI workspace dependencies
├── tsconfig.json          # TypeScript config
├── eslint.config.mjs      # ESLint strict rules
├── bin/usasset           # Executable binary
├── src/
│   ├── index.ts          # Command router (commander.js)
│   └── lib/
│       ├── process-manager.ts   # Backend process lifecycle
│       ├── health-checker.ts    # HTTP health validation  
│       ├── logger.ts           # Structured logging
│       └── constants.ts        # Configuration constants
└── dist/                 # Compiled JavaScript
```

## Usage Examples

### Start Backend and Wait for Health
```bash
./bin/usasset start
🚀 Starting USAsset backend...
✅ Backend started with PID: 12345
🔍 Waiting for backend to be ready...
🎉 Backend is ready and healthy!
```

### Check Status
```bash  
./bin/usasset status
✅ Backend is running (PID: 12345)
```

### Graceful Shutdown
```bash
./bin/usasset stop  
🛑 Stopping USAsset backend...
✅ Backend stopped successfully
```

## Integration with Backend

### Graceful Shutdown Implementation
Backend `main.ts` enhanced with graceful shutdown:
```typescript
// 10-second timeout protection
const GRACEFUL_SHUTDOWN_TIMEOUT_MS = 10000;

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
```

CLI sends SIGTERM → Backend logs "Received SIGTERM, shutting down gracefully" → Clean app.close()

### Health Endpoint Integration
```typescript
// CLI polls: GET http://localhost:3000/health
// Backend responds: { status: "ok", database: "connected", timestamp: "..." }
```

## Troubleshooting

### Common Issues
| Issue | Solution |
|-------|----------|
| "command not found" | Run `npm run build` first |
| "Backend already running" | Check `./bin/usasset status` and stop if needed |
| "Health check timeout" | Ensure backend dependencies (DB) are available |
| "Permission denied" | Make sure `bin/usasset` is executable (`chmod +x`) |

### Debug Commands
```bash
# Check CI integration
npm run ci

# View logs
ls -lt .logs/cli_*.log

# Manual testing
cd apps/backend && npm run start:dev  # Start backend manually
curl http://localhost:3000/health      # Test health endpoint
```

## Testing Strategy

### Current Status: No Unit Tests
- CLI passes with `jest --passWithNoTests`
- Integration tested through CI pipeline
- Manual testing covers all command scenarios

### Future Testing (if needed):
- Mock process spawning for unit tests
- Mock HTTP health checks
- Test graceful shutdown integration  
- End-to-end CLI command testing

**Note**: Following pragmatic principle - manual testing sufficient for current scope, unit tests can be added if CLI complexity grows beyond current simplicity.

## Key Decisions & Rationale

### Why External Process Spawning?
- **Zero coupling**: CLI doesn't import backend code
- **Process isolation**: Backend runs independently  
- **Production-like**: Same as Docker/systemd deployment
- **Simple**: Just spawns `npm run start:dev`

### Why HTTP Health Checks?
- **Standard interface**: Same endpoint used by load balancers
- **Framework agnostic**: Works with any backend framework
- **Observable**: Can monitor startup progress
- **Reliable**: HTTP is well-understood protocol

### Why CLI over GUI?  
- **CI/CD friendly**: Scriptable commands
- **Developer focused**: Terminal workflow integration
- **Minimal dependencies**: No UI framework needed
- **Testable**: Clear inputs/outputs

This CLI implementation provides robust backend management while maintaining clean architecture principles and zero coupling with the monorepo applications.