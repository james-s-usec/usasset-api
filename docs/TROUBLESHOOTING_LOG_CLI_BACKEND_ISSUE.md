# Troubleshooting Log: CLI Backend Management Issue

**Date**: September 2, 2025  
**Issue**: Backend not starting properly via CLI, stale processes interfering  
**Severity**: Medium - Development workflow blocker  
**Resolution**: Identified process management issues, documented workarounds

## 🔴 Problem Description

### Symptoms
1. CLI reports "Backend is running" but API endpoints return 404
2. Port 3000 conflicts when trying to start backend
3. CLI `start` command appears to succeed but backend dies immediately
4. Stale PID file causes confusion about running processes

### Root Causes Identified

#### 1. **Stale PID File** 
- File: `/apps/cli/.usasset.pid` contained PID 54862
- Process 54862 was no longer running
- CLI's `isBackendRunning()` only checks PID file existence, not actual process

#### 2. **Process Attachment Issue**
```typescript
// In process-manager.ts
const childProcess = spawn(commandString, {
  stdio: "inherit",  // ← PROBLEM: Backend inherits CLI's stdio
  detached: false,   // ← PROBLEM: Backend dies when CLI exits
  shell: true,
});
```

When CLI process exits, the backend process can be terminated because:
- `detached: false` - Child process is in same process group
- `stdio: "inherit"` - Shares terminal with parent process

#### 3. **Docker Container Conflict**
- Docker container `usasset-backend` was running on port 3000
- This prevented local development backend from starting
- Error: `EADDRINUSE: address already in use :::3000`

## 🟡 Investigation Steps

### 1. Check Running Processes
```bash
ps aux | grep node | grep -v grep
# Result: No backend Node processes found

./bin/usasset status
# Result: "✅ Backend is running (PID: 54862)" (FALSE POSITIVE)

ps -p 54862
# Result: Process not found - PID is stale
```

### 2. Check Port Usage
```bash
docker ps
# Found: usasset-backend container using port 3000

curl http://localhost:3000/api/users
# Result: 404 - Docker container has old code without /api/users endpoint
```

### 3. Analyze CLI Code
- CLI spawns backend but doesn't properly detach it
- PID tracking doesn't verify process is actually alive
- No cleanup of stale PID files on startup

## 🟢 Resolution Steps

### Immediate Fix
```bash
# 1. Stop Docker containers blocking ports
docker stop usasset-frontend  # Frees port 5173 for dev frontend
docker-compose stop backend   # Frees port 3000 for dev backend

# 2. Clean up stale PID file
rm apps/cli/.usasset.pid

# 3. Start backend directly (bypass CLI)
cd apps/backend && npm run start:dev

# 4. Start frontend
cd apps/frontend && npm run dev
```

### CORS Configuration Fix (Applied)
Updated `apps/backend/src/main.ts` to support multiple frontend ports:
```typescript
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
```

### Long-term Solutions

#### Option 1: Fix CLI Process Management
```typescript
// Recommended changes to process-manager.ts
const childProcess = spawn(commandString, {
  stdio: "ignore",     // Don't inherit stdio
  detached: true,      // Allow process to outlive parent
  shell: true,
});

// Detach from parent process group
childProcess.unref();
```

#### Option 2: Use PM2 or Systemd
Replace custom process management with battle-tested solutions:
```bash
# PM2 approach
pm2 start npm --name "usasset-backend" -- run start:dev
pm2 status
pm2 stop usasset-backend
```

#### Option 3: Improve PID File Handling
```typescript
public isBackendRunning(): boolean {
  const pid = this.readPidFile();
  if (!pid) return false;
  
  // Actually check if process exists
  try {
    process.kill(pid, 0); // Signal 0 = check existence
    return true;
  } catch {
    // Process doesn't exist, clean up stale PID
    this.deletePidFile();
    return false;
  }
}
```

## 📋 Lessons Learned

### 1. **Process Management is Hard**
- Custom process management often has edge cases
- Detaching processes properly requires careful stdio/process group handling
- PID files can become stale and need verification

### 2. **Docker Conflicts**
- Always check `docker ps` when debugging port conflicts
- Docker containers can persist across development sessions
- Consider using different ports for Docker vs local development

### 3. **CLI Design Considerations**
- CLI tools that manage long-running processes need robust process handling
- Consider using existing process managers (PM2, forever, systemd)
- Always verify process state, don't trust PID files blindly

## 🛠️ Recommended Actions

1. **Short Term**: Document workaround in README
   ```markdown
   ## Known Issues
   - CLI process management may fail. If backend won't start:
     1. Check Docker: `docker ps` and stop any containers on port 3000
     2. Clean PID: `rm apps/cli/.usasset.pid`
     3. Start directly: `cd apps/backend && npm run start:dev`
   ```

2. **Medium Term**: Fix CLI process detachment
   - Update `stdio` and `detached` options
   - Add PID verification to `isBackendRunning()`
   - Add startup cleanup of stale PID files

3. **Long Term**: Consider architectural changes
   - Evaluate PM2 or other process managers
   - Consider Docker Compose for all local development
   - Implement health check loop in CLI to verify actual startup

## 🔍 Debugging Commands Reference

```bash
# Check what's using ports
lsof -i :3000  # Backend port
lsof -i :5173  # Frontend port
docker ps      # Check Docker containers

# Check process by PID
ps -p <PID>
kill -0 <PID>  # Check if alive

# Clean up everything
docker stop usasset-frontend usasset-backend  # Stop Docker containers
pkill -f "node.*nest"
rm apps/cli/.usasset.pid

# Start fresh
cd apps/backend && npm run start:dev
cd apps/frontend && npm run dev

# Debug API connectivity using backend logs
curl "http://localhost:3000/logs?limit=10" | jq '.data.logs[] | select(.message | contains("/api/"))'
```

## 🐛 Using Built-in Debugging Infrastructure

### Backend Request Tracing
Every API request is automatically logged with correlation IDs:
```bash
# View recent API calls
curl "http://localhost:3000/logs?limit=10" | jq '.data.logs[] | select(.level == "INFO")'

# Trace specific request by correlation ID  
curl "http://localhost:3000/logs?correlationId=<id>"

# Filter by error level
curl "http://localhost:3000/logs?level=ERROR"
```

### Frontend Debugging
- Open browser DevTools → Network tab
- All API calls show correlation IDs in response headers
- Use correlation ID to trace backend logs
- Frontend also logs API calls to browser console

### Complete Request Flow Example
1. Frontend makes API call → generates correlation ID
2. Backend receives request → logs with correlation ID  
3. Backend processes → logs database queries
4. Backend responds → logs response with timing
5. Use correlation ID to see complete trace

## 🐛 Frontend Delete User Bug (FIXED)

### Issue Discovered
Frontend deletion appeared to fail but actually succeeded. The issue was in `apps/frontend/src/services/api.ts`.

**Root Cause:** 
```typescript
// BROKEN: Tried to parse JSON from 204 No Content response
if (!response.ok) {
  throw new Error(`API Error: ${response.status} ${response.statusText}`)
}
return response.json() // ❌ Throws error on 204 responses
```

**Timeline from Logs:**
1. Backend successfully deletes user (HTTP 204)
2. Frontend API service calls `response.json()` on 204 response
3. `response.json()` throws error (no content to parse)
4. Frontend shows "Failed to delete user" despite success

**Fix Applied:**
```typescript
// FIXED: Handle 204 No Content responses properly
if (!response.ok) {
  throw new Error(`API Error: ${response.status} ${response.statusCode}`)
}

// Handle 204 No Content responses (e.g., successful deletions)
if (response.status === 204) {
  return {} as T
}

return response.json()
```

**Lesson:** Our debugging infrastructure perfectly identified the issue - logs showed backend success (204) but frontend failure. This demonstrates the value of comprehensive request/response logging.

## 📊 Impact Analysis

- **Development Time Lost**: ~30 minutes debugging
- **Root Cause**: Architectural issue with process management
- **Workaround Complexity**: Low - just bypass CLI
- **Fix Complexity**: Medium - requires careful process handling

---

**Filed by**: Claude  
**Review status**: Pending engineering review  
**Follow-up**: Create GitHub issue for CLI process management improvements