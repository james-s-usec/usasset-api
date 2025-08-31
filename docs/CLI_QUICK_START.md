# CLI Quick Implementation Guide

## 🎯 Core Goal
Create `apps/cli` that spawns existing npm scripts via child processes. Zero coupling, maximum leverage.

## 📋 Implementation Order

### 1. Fix Backend Shutdown (Required First) ✅ COMPLETE
**Implemented robust graceful shutdown with error handling and timeout protection:**

```typescript
// apps/backend/src/main.ts - Graceful shutdown with full error handling
function setupGracefulShutdown(app, logger) {
  const shutdown = async (signal) => {
    logger.log(`Received ${signal}, shutting down gracefully`);
    
    // 10 second timeout protection
    const forceExitTimer = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, GRACEFUL_SHUTDOWN_TIMEOUT_MS);
    
    try {
      await app.close();
      clearTimeout(forceExitTimer);
      logger.log('Application shut down successfully');
      process.exit(0);
    } catch (error) {
      clearTimeout(forceExitTimer);
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}
```

**✅ TESTED & VERIFIED:**
- Graceful shutdown message: `Received SIGTERM, shutting down gracefully`
- Database cleanup: `Database disconnected`  
- Success message: `Application shut down successfully`
- Clean exit code: 0
- Shutdown time: ~6 seconds (under timeout)

**🚨 CRITICAL CLI REQUIREMENT:** CLI must track the actual Node.js process PID, not the npm wrapper PID, for graceful shutdown to work.

### 2. Create CLI Structure
```bash
mkdir -p apps/cli/{src/commands,bin,test}
cd apps/cli && npm init -y
npm install commander cross-spawn axios chalk
```

### 3. Wire Into Monorepo
```json
// Root package.json - Add to workspaces
"workspaces": ["apps/backend", "apps/frontend", "apps/cli"]

// Add scripts
"scripts": {
  "cli": "./apps/cli/bin/usasset",
  "cli:build": "npm run build --workspace=cli"
}
```

## 🔌 CLI-to-npm Integration

### Root CLI Commands
```bash
# CLI wraps existing root scripts
npm run cli start    # → npm run start:dev --workspace=backend
npm run cli build    # → npm run build (builds all)  
npm run cli test     # → npm run ci (full test suite)
```

### Direct Backend Commands  
```bash
# CLI spawns backend scripts directly
npm run cli dev      # → spawn('npm', ['run', 'start:dev'], {cwd: 'apps/backend'})
npm run cli migrate  # → spawn('npm', ['run', 'db:migrate'], {cwd: 'apps/backend'})
```

## 📊 Logging Integration

### Use Existing .logs/ Structure
```typescript
// apps/cli/src/lib/logger.ts
const LOG_DIR = path.join(process.cwd(), '.logs');
const logFile = `${LOG_DIR}/cli-${command}_${timestamp}.log`;

// Same format as existing logs
log(`[${timestamp}] 🔧 CLI: Starting ${command}`);
```

### Existing Log Files to Leverage
- `.logs/backend-build.log` - Backend build output
- `.logs/verify-deployment_*.log` - Deployment logs
- Root commands already log to `.logs/` - CLI follows same pattern

## ⚡ Minimal Viable Implementation

### Core Files Needed
```
apps/cli/
├── package.json                 # Dependencies: commander, cross-spawn, axios
├── src/
│   ├── index.ts                # CLI entry point
│   ├── commands/
│   │   ├── start.ts           # spawn('npm', ['run', 'start:prod'])
│   │   └── health.ts          # axios.get('http://localhost:3000/health')
│   └── lib/
│       ├── process.ts         # Child process utilities
│       └── logger.ts          # Log to .logs/cli-*.log
├── bin/
│   └── usasset               # #!/usr/bin/env node
└── test/
    └── integration.test.ts   # Spawn CLI, verify backend starts
```

### 5 Essential Commands
1. **start**: Spawn backend production
2. **health**: HTTP check backend health  
3. **stop**: Kill spawned process
4. **logs**: Tail backend logs
5. **status**: Check if backend running

## 🧪 Testing Strategy
```bash
# Integration test - spawn real processes
test('CLI start works', async () => {
  const proc = spawn('./bin/usasset', ['start']);
  await waitForHealth('http://localhost:3000/health', 30000);
  proc.kill('SIGTERM');
});
```

## ✅ Success Criteria
1. `npm run cli start` starts backend
2. `npm run cli health` returns backend status
3. CLI logs to `.logs/cli-*.log` 
4. Integration test passes
5. Existing scripts still work

## 📚 Document Cross-References
- **Full Plan**: [CLI_IMPLEMENTATION_PLAN.md](./CLI_IMPLEMENTATION_PLAN.md) - Complete technical details
- **Quality Gates**: [CLI_QUALITY_GATES.md](./CLI_QUALITY_GATES.md) - Testing checklist
- **This Doc**: Quick implementation roadmap

**Next Action**: Implement graceful shutdown in backend main.ts, then create apps/cli structure.