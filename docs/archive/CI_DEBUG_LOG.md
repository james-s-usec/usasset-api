# CI Debug Log - Troubleshooting Frozen Commands

## Date: 2025-09-03
## Issue: npm run ci freezes VS Code and Docker Desktop

---

## Environment Information
- **Working Directory**: /home/swansonj/projects/USAsset3
- **Node Version**: v20.19.2
- **npm Version**: 10.8.2
- **Platform**: WSL2 (Linux 5.15.153.1-microsoft-standard-WSL2)
- **Docker**: Running (check with `docker ps`)
- **Memory**: ~~1.9GB~~ → **8GB** (updated in .wslconfig)

---

## CI Script Breakdown
Full command from package.json:
```bash
"ci": "rm -rf .logs/*.log && echo '🔍 Running lint...' && npm run lint && echo '🔧 Running typecheck...' && npm run typecheck && echo '🧪 Running tests...' && npm run test && echo '🏗️  Running build...' && npm run build && npm run ci:summary"
```

Individual commands to test:
1. `rm -rf .logs/*.log` - Clear logs
2. `npm run lint` - ESLint checking
3. `npm run typecheck` - TypeScript validation  
4. `npm run test` - Run test suites
5. `npm run build` - Build all workspaces
6. `npm run ci:summary` - Generate summary

---

## Debugging Session Log

### Pre-flight Checks
- [x] Docker is running: `docker ps` - No containers running
- [x] PostgreSQL container is up: `docker-compose ps` - Not running
- [x] No orphaned Node processes: `ps aux | grep node` - 15 VS Code related processes
- [x] Available memory: `free -h` - 1.9Gi total, 1.7Gi used
- [x] Available disk space: `df -h` - 927G available (96% free)

### Step-by-Step Testing

#### Step 1: Clean Logs
```bash
# Time: 08:54:57
rm -rf .logs/*.log
echo "Logs cleared successfully"
```
Result: SUCCESS
Duration: 0.006s

#### Step 2: Test Lint
```bash
# Time: 08:55:00
timeout 30 npm run lint 2>&1 | tee .logs/debug-lint.log
```
Result: SUCCESS - "Lint checks complete"
Duration: 17.039s
Issues Found: None - all linters pass

#### Step 3: Test Typecheck
```bash
# Time: 08:55:30
timeout 60 npm run typecheck 2>&1 | tee .logs/debug-typecheck.log
```
Result: SUCCESS - "Typecheck complete"
Duration: 4.211s
Issues Found: None - no type errors

#### Step 4: Test Tests
```bash
# Time: 08:57:22
timeout 120 npm run test 2>&1 | tee .logs/debug-test.log
```
Result: **FAILED/HUNG** - Process killed
Duration: Timeout/killed
Issues Found: **SIGKILL in jest worker process (pid=6773)** - Memory exhaustion suspected

#### Step 5: Test Build
```bash
# Time: 08:59:00
timeout 300 npm run build 2>&1 | tee .logs/debug-build.log
```
Result: SUCCESS - "Build complete"
Duration: 26.075s
Issues Found: None - all builds successful

#### Step 6: Test CI Summary
```bash
# Time: Not tested due to test failure
timeout 10 npm run ci:summary 2>&1 | tee .logs/debug-summary.log
```
Result: Not tested
Duration: N/A

---

## System Resource Monitoring

### During Each Command
Monitor in separate terminal:
```bash
# CPU and Memory
watch -n 1 'top -b -n 1 | head -20'

# Docker stats
docker stats --no-stream

# Node processes
ps aux | grep node | wc -l
```

### Resource Usage Table
| Command | Peak CPU | Peak Memory | Duration | Node Processes | Status |
|---------|----------|-------------|----------|----------------|--------|
| lint    | ~55%     | 1.7Gi used  | 17.039s  | 15+            | ✅ Pass |
| typecheck| ~12%    | 1.7Gi used  | 4.211s   | 15+            | ✅ Pass |
| test    | **100%** | **1.9Gi**   | HUNG     | 15+            | ❌ SIGKILL |
| build   | ~57%     | 1.3Gi used  | 26.075s  | 15+            | ✅ Pass |

---

## Identified Issues

### Issue #1: Test Suite Memory Exhaustion
- **Command**: `npm run test`
- **Symptom**: Jest worker process receives SIGKILL, VS Code and Docker freeze
- **Root Cause**: Running tests in parallel across all workspaces exhausts available memory (1.9Gi total, already 1.7Gi used by VS Code)
- **Solution**: Run tests sequentially per workspace instead of parallel

### Issue #2: Parallel Execution Resource Contention
- **Command**: All CI commands
- **Symptom**: Commands run in parallel using `&` operator compete for resources
- **Root Cause**: The package.json scripts use parallel execution (`&`) which causes memory/CPU spikes
- **Solution**: Use sequential execution or the provided `debug-ci.sh` script

### Issue #3: VS Code Memory Usage
- **Command**: N/A
- **Symptom**: VS Code processes consume ~1.7Gi of 1.9Gi available memory
- **Root Cause**: Multiple VS Code extension hosts and language servers running
- **Solution**: Close unnecessary VS Code windows/extensions before running CI

---

## Recommendations

### Immediate Fixes
1. ~~**Use `./debug-ci.sh` instead of `npm run ci`** - Runs commands sequentially with memory monitoring~~ ✅ Created
2. ~~**Close VS Code before running CI** - Frees up ~1.7Gi memory~~ → Not needed with 8GB
3. ~~**Increase WSL2 memory limit** - Edit `.wslconfig` to allocate more RAM (e.g., 4GB)~~ ✅ Increased to 8GB

### Long-term Improvements
1. **Configure Jest for lower memory usage**:
   ```json
   // jest.config.js
   maxWorkers: 1,  // Run tests serially
   workerIdleMemoryLimit: '512MB'
   ```
2. **Split CI into stages**:
   - Stage 1: lint + typecheck (low memory)
   - Stage 2: test (needs more memory)
   - Stage 3: build (moderate memory)
3. **Add memory monitoring to CI pipeline** - Fail fast if memory is insufficient

---

## Alternative CI Script
Created `debug-ci.sh` with:
- Sequential execution by workspace
- Memory monitoring before/after each step
- Timeout protection (60-120s per command)
- Colored output for easy reading
- Detailed logging to `.logs/debug-ci-*.log`

Usage:
```bash
./debug-ci.sh
```

---

## WSL2 Memory Configuration

### Configuration Update (2025-09-03)
User increased memory from 1.9GB to 8GB in `.wslconfig`:
```ini
[wsl2]
memory=8GB  # Increased from default 2GB
swap=4GB    # Add swap space (optional)
```

### To Apply Changes:
1. Open Windows PowerShell as Administrator
2. Run: `wsl --shutdown`
3. Restart WSL/Ubuntu terminal
4. Verify with: `free -h` (should show ~8GB)

### Expected Impact:
- Before: 1.9GB total, 1.7GB used by VS Code = only 200MB free
- After: 8GB total, 1.7GB used by VS Code = 6.3GB free
- **Result**: Parallel Jest tests should now run without memory exhaustion

---

## Notes
- The root cause is memory exhaustion when running parallel Jest tests with limited RAM (1.9Gi)
- VS Code's extension processes consume significant memory (~1.7Gi)
- Sequential execution solves the issue but increases CI time
- Docker Desktop freezes because WSL2 hits memory limits, affecting all WSL processes
- **SOLUTION APPLIED**: Increased WSL2 memory from 1.9GB to 8GB via .wslconfig
- **NEXT STEPS**: ~~All completed~~
  1. ✅ Restart WSL with `wsl --shutdown` from Windows PowerShell
  2. ✅ Verify memory with `free -h` (showed 7.8GB + 4GB swap)
  3. ✅ Test `npm run ci` - **COMPLETED SUCCESSFULLY in 45 seconds!**

## Resolution Summary (2025-09-03 09:08)
- **Problem**: CI frozen due to 1.9GB memory limit
- **Solution**: Increased WSL2 memory to 8GB
- **Result**: `npm run ci` now completes in 45 seconds without freezing
- **Memory Usage**: Peak ~2.1GB used, 5.7GB still available
- **All tests passed**: 6 suites, 12 tests in 9.5 seconds