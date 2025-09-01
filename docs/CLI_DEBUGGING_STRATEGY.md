# CLI Debugging Strategy

## Overview
This document outlines the systematic debugging approach used to resolve CLI spawn errors and improve error handling in the USAsset CLI tool.

## Problem Summary
The CLI `./bin/usasset start` command was failing with `spawn npm ENOENT` errors due to incorrect path calculation when spawning backend processes.

## Debugging Approach

### 1. Systematic Path Verification
**Problem**: Spawn errors often hide the real issue - incorrect paths or missing executables.

**Solution**: Added comprehensive debug logging to reveal actual paths being used:
```typescript
const debugLog = (message: string, data?: unknown): void => {
  if (process.env.DEBUG) {
    console.log(`[DEBUG] ${message}`, data || "");
  }
};

// Log all path calculations
debugLog("Working directory for spawn:", backendPath);
debugLog("Command being spawned:", command[0], command.slice(1));
```

**Key Finding**: Path calculation was traversing too many levels up, resulting in `/home/james/projects/apps/backend` instead of `/home/james/projects/usasset-api/apps/backend`.

### 2. Error Message Enhancement
**Problem**: Generic error messages like "Failed to start backend" provide no actionable information.

**Solution**: Created centralized error handler with detailed context:
```typescript
export class ErrorHandler {
  public static handleApiError(error: unknown, operation: string): void {
    if (axios.isAxiosError(error)) {
      // Show validation errors clearly
      if (error.response?.data?.errors) {
        console.error(`\nValidation errors:`);
        for (const err of errors) {
          console.error(`  - ${err.field}: ${err.message}`);
        }
      }
    }
  }
}
```

### 3. Port Conflict Detection
**Problem**: Backend fails to start when port is already in use, with unhelpful errors.

**Solution**: Added proactive port checking and cleanup:
```typescript
public cleanupPort(port: number): boolean {
  const pids = this.getProcessesUsingPort(port);
  for (const pid of pids) {
    process.kill(parseInt(pid), "SIGTERM");
  }
}
```

### 4. API Response Structure Discovery
**Problem**: CLI commands weren't working because of assumptions about API response format.

**Solution**: Used curl to test actual API responses:
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}' | jq
```

**Key Finding**: Backend wraps all responses in `{ success: true, data: {...} }` structure.

### 5. TypeScript Strict Mode Compliance
**Problem**: TypeScript strict mode caught potential runtime errors with type conversions.

**Solution**: Added proper type guards and helper methods:
```typescript
private hasValue(value: unknown): boolean {
  return value !== undefined && value !== null;
}

private convertToString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }
  return undefined;
}
```

## Lessons Learned

### 1. Debug First, Fix Second
- Always add debug logging before attempting fixes
- Make debug output conditional with DEBUG environment variable
- Keep debug code in place but disabled by default

### 2. Test Actual Behavior
- Don't assume API response formats - test with curl
- Check what's actually in process.argv and process.cwd()
- Verify file paths exist before using them

### 3. Error Messages Should Be Actionable
- Show the actual command that failed
- Include the working directory
- Suggest fixes (e.g., "Port 3000 is in use. Run './bin/usasset cleanup' to free it")

### 4. Handle All Response Formats
- Backend APIs often wrap responses
- Check for both success and error response structures
- Test with actual API calls, not just assumptions

### 5. Maintain Quality Gates
- Run `npm run ci` after every change
- Fix lint errors immediately - they often catch real bugs
- TypeScript strict mode prevents runtime errors

## Debug Commands Reference

### Enable Debug Output
```bash
DEBUG=1 ./bin/usasset start
```

### Test API Directly
```bash
# List users
curl http://localhost:3000/api/users | jq

# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}' | jq
```

### Check Port Usage
```bash
lsof -i :3000
```

### Clean Up Stuck Processes
```bash
./bin/usasset cleanup
```

### Verify Backend Health
```bash
curl http://localhost:3000/health | jq
```

## Future Improvements

1. **Add Retry Logic**: Implement exponential backoff for health checks
2. **Better Process Management**: Use proper process managers like PM2 for production
3. **Structured Logging**: Use Winston or similar for consistent log formatting
4. **Integration Tests**: Add end-to-end tests for all CLI commands
5. **Error Recovery**: Add automatic cleanup and retry on common errors

## Conclusion
Systematic debugging with comprehensive logging, actual API testing, and proper error handling transformed a cryptic spawn error into a working, maintainable CLI tool. The key is to make problems visible through logging before attempting fixes.