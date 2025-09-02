# CLI Application Implementation Plan

> **Quick Start**: See [CLI_QUICK_START.md](./CLI_QUICK_START.md) for immediate implementation steps.
> **Quality Gates**: See [CLI_QUALITY_GATES.md](./CLI_QUALITY_GATES.md) for testing checklist.

## CRITICAL FINDINGS: Missing Clean Exit Points

### ❌ Backend Gaps Identified
- **No graceful shutdown** - only `process.exit(1)` on error
- **No signal handlers** for SIGTERM/SIGINT  
- **No resource cleanup** when stopping
- **No connection draining** during shutdown

### ✅ Available Entry Points & Interfaces
- **npm scripts**: `start:dev`, `start:prod`, `start:debug`, database commands
- **Health endpoints**: `/health`, `/health/ready`, `/health/live`, `/health/db`
- **Port handling**: `PORT` env var (default 3000)
- **Docker entrypoint**: `docker-entrypoint.sh` with migration support
- **Development scripts**: `local-dev.sh`, `health-check.sh`

## Integration Approach: Process Spawning (Selected)

**Why Process Spawning?**
- Cleanest separation of concerns
- Leverages existing npm scripts in backend
- No direct import dependencies between apps
- Follows Unix philosophy: do one thing well
- Easy to maintain and debug

## Architecture Decision

### Selected: Option A - Process Spawning
```typescript
// CLI spawns backend as child process
spawn('npm', ['run', 'start:dev'], { 
  cwd: path.join(__dirname, '../../backend'),
  stdio: 'inherit' 
});
```

**Benefits:**
- Zero coupling between CLI and backend code
- Uses battle-tested npm scripts
- Process isolation and management
- Clear separation of responsibilities

**Rejected Options:**
- Option B (Shared Library): Adds complexity, violates monorepo boundaries
- Option C (Direct Imports): Creates tight coupling, violates clean architecture

## Available Scripts Analysis

### Root Package.json Scripts
```bash
npm run dev              # Start both backend & frontend
npm run build            # Build both apps with logging
npm run lint             # Lint both apps with logging  
npm run test             # Test both apps with logging
npm run typecheck        # Typecheck both apps with logging
npm run ci               # Full CI pipeline (lint→typecheck→test→build)
npm run db:migrate       # Backend Prisma migrations
npm run db:seed          # Backend Prisma seeding
npm run dev:local        # ./utilities/development/local-dev.sh
```

### Backend Package.json Scripts  
```bash
npm run start:dev        # nest start --watch
npm run start:dev:log    # LOG_TO_FILE=true nest start --watch
npm run start:prod       # node dist/main
npm run start:prod:log   # LOG_TO_FILE=true node dist/main
npm run build            # nest build
npm run db:migrate       # prisma migrate dev
npm run db:deploy        # prisma migrate deploy
npm run db:seed          # prisma db seed
npm run azure:deploy     # prisma migrate deploy && npm run start:prod
```

### Available Shell Scripts
```bash
./utilities/development/local-dev.sh           # Interactive Docker dev menu
./utilities/testing/health-check.sh            # E2E health testing
./utilities/deployment/update-azure-v2.sh      # Azure deployment
./utilities/deployment/verify-deployment-v2.sh # Deployment verification
./apps/backend/docker-entrypoint.sh           # Docker container startup
```

## Implementation Plan

### Phase 0: Fix Backend Graceful Shutdown (REQUIRED FIRST)
**Must implement before CLI to ensure clean process management:**
```typescript
// Add to main.ts
process.on('SIGTERM', async () => {
  await app.close();
  process.exit(0);
});
process.on('SIGINT', async () => {
  await app.close(); 
  process.exit(0);
});
```

### Phase 1: Setup CLI App Structure
```
apps/cli/
├── package.json                 # CLI dependencies only
├── src/
│   ├── commands/
│   │   ├── start.ts            # spawn('npm', ['run', 'start:prod'])
│   │   ├── dev.ts              # spawn('npm', ['run', 'start:dev'])
│   │   ├── migrate.ts          # spawn('npx', ['prisma', 'migrate'])
│   │   └── health.ts           # HTTP requests to /health
│   ├── lib/
│   │   ├── process-manager.ts  # Child process utilities
│   │   ├── config.ts           # Environment handling
│   │   └── http-client.ts      # Health check utilities
│   └── index.ts                # CLI entry point with Commander.js
├── bin/
│   └── usasset                 # #!/usr/bin/env node
├── tsconfig.json
└── CLAUDE.md
```

### Phase 2: Root Integration
Update `package.json` workspaces:
```json
{
  "workspaces": ["apps/backend", "apps/frontend", "apps/cli"],
  "scripts": {
    "cli:build": "npm run build --workspace=cli",
    "cli:start": "npm run start --workspace=cli",
    "cli": "./apps/cli/bin/usasset"
  }
}
```

### Phase 3: CLI Commands Implementation
**CLI will leverage existing npm scripts and shell scripts:**
```bash
# Core Commands
usasset start     # spawn('npm', ['run', 'start:prod'], {cwd: 'apps/backend'})
usasset dev       # spawn('npm', ['run', 'start:dev'], {cwd: 'apps/backend'})
usasset stop      # Send SIGTERM to spawned process
usasset restart   # stop + start

# Database Commands  
usasset migrate   # spawn('npm', ['run', 'db:migrate'], {cwd: 'apps/backend'})
usasset seed      # spawn('npm', ['run', 'db:seed'], {cwd: 'apps/backend'})
usasset db        # Interactive Prisma Studio

# Health & Monitoring
usasset health    # HTTP GET http://localhost:3000/health
usasset status    # Check if process is running + health endpoints
usasset logs      # tail -f apps/backend/logs/*.log

# Development Helpers
usasset docker    # ./utilities/development/local-dev.sh
usasset test      # ./utilities/testing/health-check.sh local
usasset deploy    # ./utilities/deployment/update-azure-v2.sh
```

### Phase 4: Process Management
- Child process lifecycle management
- Signal handling (SIGINT, SIGTERM)
- Log aggregation and forwarding
- Error handling and recovery

## Key Design Principles

1. **Zero Coupling**: CLI and backend are separate processes
2. **Leverage Existing**: Use current npm scripts and tooling
3. **Process Isolation**: Each app runs independently
4. **Clean Interfaces**: HTTP/process boundaries only
5. **Monorepo Benefits**: Shared tooling, unified deployment

## Technical Implementation Details

### Dependencies (apps/cli/package.json)
```json
{
  "dependencies": {
    "commander": "^11.0.0",      # CLI framework
    "cross-spawn": "^7.0.3",     # Cross-platform process spawning
    "axios": "^1.6.0",           # HTTP client for health checks
    "chalk": "^5.3.0"            # Terminal colors
  }
}
```

### CLI Entry Point
```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { startCommand } from './commands/start';
import { devCommand } from './commands/dev';

const program = new Command();
program
  .name('usasset')
  .description('USAsset CLI for backend management')
  .version('1.0.0');

program
  .command('start')
  .description('Start backend server')
  .action(startCommand);

program
  .command('dev')  
  .description('Start development server')
  .action(devCommand);

program.parse();
```

## Quality Gates & Testing Strategy

### Integration Testing Approach (Not Unit Testing)
**Test the ACTUAL process spawning and CLI behavior end-to-end:**

```bash
# CLI Integration Test Suite
apps/cli/test/integration/
├── cli-start.test.ts        # Test CLI can start/stop backend
├── cli-health.test.ts       # Test health commands work
├── cli-database.test.ts     # Test database commands work  
├── cli-process.test.ts      # Test process management
└── cli-environments.test.ts # Test local vs Azure behavior
```

### Quality Gates (Pre-Implementation)
1. **Plan Validation**: Every CLI command maps to existing script/endpoint
2. **Interface Contracts**: Define exact inputs/outputs for each command
3. **Environment Matrix**: Define behavior for local/Docker/Azure contexts
4. **Failure Scenarios**: Define error handling for each failure mode

### Quality Gates (During Implementation)
1. **Integration Tests Pass**: All E2E tests must pass before merge
2. **Real Process Testing**: Tests spawn actual backend processes
3. **Environment Parity**: Same commands work local and Azure
4. **Performance Gates**: CLI commands respond within SLA times

### Quality Gates (Post-Implementation)
1. **Deployment Verification**: CLI works in CI/CD pipeline
2. **Monitoring Integration**: CLI health checks integrate with existing monitoring
3. **Documentation Coverage**: Every command has usage examples
4. **Backward Compatibility**: Existing npm scripts still work

## Azure vs Local Development Strategy

### Environment Detection Pattern
```typescript
// apps/cli/src/lib/environment.ts
export function detectEnvironment(): Environment {
  // Azure Container Apps detection
  if (process.env.CONTAINER_APP_NAME) return 'azure';
  // Docker detection  
  if (fs.existsSync('/.dockerenv')) return 'docker';
  // Local development
  return 'local';
}
```

### Configuration Strategy
```typescript
// apps/cli/src/lib/config.ts
interface EnvironmentConfig {
  backendUrl: string;
  databaseUrl: string;
  logPath: string;
  scriptPath: string;
}

const configs: Record<Environment, EnvironmentConfig> = {
  local: {
    backendUrl: 'http://localhost:3000',
    databaseUrl: 'postgresql://dbadmin:localpassword123@localhost:5433/usasset',
    logPath: './apps/backend/logs',
    scriptPath: './apps/backend'
  },
  azure: {
    backendUrl: process.env.BACKEND_URL || 'https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io',
    databaseUrl: process.env.DATABASE_URL,
    logPath: '/app/logs',
    scriptPath: '/app'
  }
};
```

## Best Practices Implementation

### 1. Fail Fast Principle
```typescript
// Pre-flight checks before any command
async function preflightChecks(command: string) {
  // Verify backend directory exists
  if (!fs.existsSync(path.join(process.cwd(), 'apps/backend'))) {
    throw new Error('Must run from project root');
  }
  
  // Verify npm scripts exist
  if (!hasScript(command)) {
    throw new Error(`Backend script '${command}' not found`);
  }
  
  // Verify environment prerequisites
  await validateEnvironment();
}
```

### 2. Process Contract Validation
```typescript
// Ensure clean interfaces between CLI and backend
interface ProcessContract {
  command: string[];
  cwd: string;
  env: Record<string, string>;
  expectedExitCodes: number[];
  timeoutMs: number;
  healthCheckUrl?: string;
}

const contracts: Record<string, ProcessContract> = {
  'start': {
    command: ['npm', 'run', 'start:prod'],
    cwd: 'apps/backend',
    env: { NODE_ENV: 'production' },
    expectedExitCodes: [0],
    timeoutMs: 30000,
    healthCheckUrl: 'http://localhost:3000/health'
  }
};
```

### 3. Monitoring & Observability
```typescript
// CLI commands report to same logging/monitoring as backend
class CLITelemetry {
  static trackCommand(cmd: string, duration: number, success: boolean) {
    // Log to same .logs/ directory as other apps
    // Send metrics to same monitoring as backend
    // Correlate with backend health checks
  }
}
```

### 4. Integration Test Examples
```typescript
// Test actual CLI behavior, not mocked
describe('CLI Integration Tests', () => {
  test('usasset start should spawn backend and pass health check', async () => {
    // Start CLI command
    const process = spawn('usasset', ['start']);
    
    // Wait for startup
    await waitForHealthCheck('http://localhost:3000/health', 30000);
    
    // Verify backend responding
    const response = await fetch('http://localhost:3000/health');
    expect(response.status).toBe(200);
    
    // Stop cleanly
    process.kill('SIGTERM');
    await waitForShutdown(process, 10000);
  });
  
  test('usasset migrate should run Prisma migrations', async () => {
    // Ensure clean database state
    await resetTestDatabase();
    
    // Run migration via CLI
    const result = await execCLI(['migrate']);
    
    // Verify migrations applied
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Migration applied');
    
    // Verify database schema
    const tables = await queryDatabase('SELECT tablename FROM pg_tables');
    expect(tables).toContainEqual({ tablename: 'User' });
  });
});
```

### 5. Azure-Specific Considerations
```bash
# CLI must work in Azure Container Apps context
# - No interactive input (non-TTY)
# - Different file paths (/app vs ./apps)
# - Azure Key Vault secrets as env vars
# - Container restart policies
# - Log aggregation to Azure Monitor

# Azure deployment verification
usasset deploy --verify-health --timeout 300
usasset status --azure --include-logs
```

This approach ensures the CLI is production-ready with proper testing and environment handling.