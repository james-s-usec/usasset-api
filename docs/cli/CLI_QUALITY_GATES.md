# CLI Quality Gates & Implementation Checklist

> **Quick Start**: See [CLI_QUICK_START.md](./CLI_QUICK_START.md) for immediate next steps.
> **Full Plan**: See [CLI_IMPLEMENTATION_PLAN.md](./CLI_IMPLEMENTATION_PLAN.md) for complete technical details.

## Pre-Implementation Gates ✋

### 1. Command-to-Script Mapping Validation
**Every CLI command MUST map to existing functionality:**

| CLI Command | Target Script/Endpoint | Environment | Status |
|-------------|------------------------|-------------|---------|
| `usasset start` | `npm run start:prod` (backend) | Local/Azure | ❌ Not Impl |
| `usasset dev` | `npm run start:dev` (backend) | Local Only | ❌ Not Impl |
| `usasset stop` | SIGTERM to spawned process | Local/Azure | ❌ Not Impl |
| `usasset migrate` | `npm run db:migrate` (backend) | Local/Azure | ❌ Not Impl |
| `usasset seed` | `npm run db:seed` (backend) | Local/Azure | ❌ Not Impl |
| `usasset health` | `GET /health` endpoint | Local/Azure | ❌ Not Impl |
| `usasset status` | Process check + health | Local/Azure | ❌ Not Impl |
| `usasset logs` | Tail backend log files | Local/Azure | ❌ Not Impl |
| `usasset docker` | `./utilities/development/local-dev.sh` | Local Only | ❌ Not Impl |
| `usasset test` | `./utilities/testing/health-check.sh` | Local/Azure | ❌ Not Impl |
| `usasset deploy` | `./utilities/deployment/update-azure-v2.sh` | Azure | ❌ Not Impl |

### 2. Interface Contract Validation
**Before implementing, define exact behavior:**

```typescript
// Contract Definition Template
interface CommandContract {
  name: string;
  description: string;
  arguments: Argument[];
  flags: Flag[];
  environments: Environment[];
  prerequisites: string[];
  exitCodes: { code: number; meaning: string }[];
  timeouts: { operation: string; seconds: number }[];
  outputs: { stream: 'stdout' | 'stderr'; format: string }[];
}
```

### 3. Environment Matrix Definition
**Define behavior across all contexts:**

| Environment | Detection Method | Config Source | Log Path | Script Path |
|-------------|------------------|---------------|----------|-------------|
| Local Dev | No Docker/Azure env | `.env` file | `./apps/backend/logs/` | `./apps/backend` |
| Docker Local | `/.dockerenv` exists | Docker env vars | `/app/logs/` | `/app` |
| Azure Prod | `CONTAINER_APP_NAME` | Key Vault env vars | `/app/logs/` | `/app` |

## During-Implementation Gates 🚧

### 1. Integration Test Results
**ALL tests must pass before merge:**

```bash
# Run integration test suite
npm run test:cli:integration

# Expected results:
✅ CLI Start/Stop Tests (5/5 passed)
✅ CLI Health Tests (3/3 passed)  
✅ CLI Database Tests (4/4 passed)
✅ CLI Process Management Tests (6/6 passed)
✅ CLI Environment Tests (9/9 passed)

Total: 27/27 tests passed ✅
```

### 2. Real Process Testing Verification
**Tests MUST spawn actual processes, not mocks:**

```typescript
// ✅ CORRECT: Spawn real backend process
const backendProcess = spawn('npm', ['run', 'start:dev'], {
  cwd: path.join(__dirname, '../../../backend')
});

// ❌ WRONG: Mock the process
const mockProcess = { 
  kill: jest.fn(),
  stdout: mockStream
};
```

### 3. Performance SLA Gates
**Commands must meet performance requirements:**

| Command | Max Response Time | Health Check Required |
|---------|-------------------|----------------------|
| `usasset start` | 30 seconds to healthy | Yes - HTTP 200 /health |
| `usasset stop` | 10 seconds to shutdown | Yes - Process exit |
| `usasset health` | 5 seconds | Yes - Valid JSON response |
| `usasset status` | 3 seconds | No |
| `usasset logs` | 2 seconds to start streaming | No |

### 4. Environment Parity Verification
**Same command behavior across environments:**

```bash
# Local test
usasset start --verify
usasset health --json | jq '.status' # Should be "ok"

# Azure test (in Container App)
usasset start --verify --azure
usasset health --json | jq '.status' # Should be "ok"

# Results must be identical
```

## Post-Implementation Gates 🎯

### 1. CI/CD Pipeline Integration
**CLI must work in GitHub Actions:**

```yaml
# .github/workflows/cli-test.yml
- name: Test CLI in CI
  run: |
    npm run cli:build
    npm run cli:test:integration
    ./apps/cli/bin/usasset start --ci-mode
    ./apps/cli/bin/usasset health --timeout 30
    ./apps/cli/bin/usasset stop
```

### 2. Monitoring Integration Verification
**CLI logs integrate with existing monitoring:**

```bash
# CLI logs should appear in same structure
ls -la .logs/
# Expected:
# cli-start_20250831_143022.log
# cli-health_20250831_143023.log
# backend-build.log
# frontend-build.log

# Log format should match existing patterns
tail -f .logs/cli-start_*.log
# [2025-08-31 14:30:22] ✅ CLI: Backend started successfully
# [2025-08-31 14:30:23] 🔍 CLI: Health check passed (127ms)
```

### 3. Documentation Coverage Gate
**Every command needs complete documentation:**

```bash
# Help text coverage
usasset --help                    # General help ✅
usasset start --help             # Command-specific help ✅
usasset health --help            # Command-specific help ✅

# Examples in README
cat apps/cli/README.md | grep -c "usasset"  # Should be > 10
```

### 4. Backward Compatibility Verification
**Existing workflows MUST continue working:**

```bash
# These must still work after CLI implementation
npm run dev                      # ✅ Still works
npm run start:dev --workspace=backend  # ✅ Still works
./utilities/development/local-dev.sh   # ✅ Still works
```

## Implementation Progress Tracking

### Phase 0: Graceful Shutdown ❌
- [ ] Add SIGTERM/SIGINT handlers to backend main.ts
- [ ] Test process cleanup works correctly
- [ ] Verify resource cleanup (DB connections, etc.)

### Phase 1: CLI Structure ❌
- [ ] Create apps/cli directory
- [ ] Set up package.json with dependencies
- [ ] Create basic CLI framework with Commander.js
- [ ] Add to root workspace configuration

### Phase 2: Core Commands ❌
- [ ] Implement `usasset start` command
- [ ] Implement `usasset stop` command  
- [ ] Implement `usasset health` command
- [ ] Implement process management utilities

### Phase 3: Database Commands ❌
- [ ] Implement `usasset migrate` command
- [ ] Implement `usasset seed` command
- [ ] Test database operations work correctly

### Phase 4: Integration Tests ❌
- [ ] Set up integration test framework
- [ ] Write CLI start/stop tests
- [ ] Write CLI health check tests
- [ ] Write CLI database tests
- [ ] Write CLI environment tests

### Phase 5: Azure Integration ❌
- [ ] Implement Azure environment detection
- [ ] Test CLI in Azure Container Apps
- [ ] Verify Azure-specific configurations
- [ ] Test deployment integration

## Quality Gate Enforcement

**RULE: No merge until ALL gates pass ✅**

1. **Pre-Implementation**: All mappings and contracts defined
2. **During-Implementation**: All integration tests passing  
3. **Post-Implementation**: Full documentation and compatibility verified

**Quality Gate Review Process:**
1. Self-review checklist completion
2. Integration test suite execution
3. Performance SLA verification
4. Documentation completeness check
5. Peer review approval

This ensures CLI is production-ready with proper validation at every step.