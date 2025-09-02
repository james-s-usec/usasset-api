# Spawn ENOENT Debugging Guide

## Quick Diagnosis Checklist

When you get `spawn ENOENT` errors, check these IN ORDER:

### 1. ✅ Is the working directory correct?
```javascript
// ALWAYS add this debug line first:
console.log('Trying to spawn in:', cwd);
console.log('Directory exists?', existsSync(cwd));
```

### 2. ✅ Is the command in PATH?
```bash
which npm     # Should return path like /usr/bin/npm
echo $PATH    # Should include /usr/bin
```

### 3. ✅ Debug with explicit logging:
```javascript
const childProcess = spawn(cmd, args, options);
childProcess.on('error', (err) => {
  console.error('Spawn error details:', {
    command: cmd,
    args: args,
    cwd: options.cwd,
    error: err.message,
    code: err.code,
    path: err.path,
    syscall: err.syscall
  });
});
```

## Common ENOENT Causes & Fixes

### Cause 1: Wrong Working Directory (OUR BUG!)
**Symptom:** `spawn npm ENOENT` even though npm is installed
**Debug:** Log the `cwd` option - it's probably wrong
**Fix:** Verify path calculation with explicit logging

### Cause 2: Command Not in PATH
**Symptom:** Works in terminal, fails in Node
**Debug:** `console.log(process.env.PATH)`
**Fix:** Use absolute path or `shell: true`

### Cause 3: Shell Path Issues (WSL/Windows)
**Symptom:** `spawn /bin/sh ENOENT`
**Debug:** Shell is at `/usr/bin/sh` not `/bin/sh`
**Fix:** Use `cross-spawn` library with `shell: true`

## Prevention Strategy

### 1. Always Validate Paths
```javascript
function spawnBackend(command) {
  const backendPath = calculateBackendPath();
  
  // ALWAYS DO THIS:
  if (!existsSync(backendPath)) {
    throw new Error(`Path does not exist: ${backendPath}`);
  }
  
  // Now spawn...
}
```

### 2. Add Debug Mode
```javascript
if (process.env.DEBUG_CLI) {
  console.log('Debug Info:', {
    cwd: backendPath,
    command: command,
    PATH: process.env.PATH
  });
}
```
Run with: `DEBUG_CLI=1 ./bin/usasset start`

### 3. Test Path Calculation
```javascript
// Add a test command to verify paths:
program
  .command('debug-paths')
  .action(() => {
    console.log('process.argv[1]:', process.argv[1]);
    console.log('Calculated backend path:', backendPath);
    console.log('Path exists?:', existsSync(backendPath));
  });
```

### 4. Use Path Helpers
```javascript
// Instead of multiple dirname() calls:
const projectRoot = path.resolve(process.argv[1], '../../../../');

// Better - use a helper:
function findProjectRoot() {
  let dir = path.dirname(process.argv[1]);
  while (dir !== '/') {
    if (existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  throw new Error('Could not find project root');
}
```

## The Golden Rule

**NEVER ASSUME PATHS - ALWAYS VERIFY THEM!**

```javascript
// Bad:
const backendPath = join(projectRoot, "apps/backend");
spawn('npm', ['run', 'start:dev'], { cwd: backendPath });

// Good:
const backendPath = join(projectRoot, "apps/backend");
if (!existsSync(backendPath)) {
  console.error(`ERROR: Backend path does not exist: ${backendPath}`);
  console.error('Current dir:', process.cwd());
  console.error('Process argv[1]:', process.argv[1]);
  process.exit(1);
}
spawn('npm', ['run', 'start:dev'], { cwd: backendPath });
```

## Quick Debug One-Liner

When spawn fails, run this immediately:
```bash
node -e "const {spawn} = require('child_process'); const cp = spawn('npm', ['--version'], {cwd: '/path/you/think/is/right'}); cp.on('error', e => console.log('Error:', e))"
```

This will quickly tell you if it's a PATH issue or a CWD issue.

## Summary

1. **Path issues cause 90% of spawn ENOENT errors**
2. **Always validate directories exist before spawning**
3. **Add debug logging that shows the actual paths being used**
4. **Test on multiple platforms (Linux, WSL, Windows)**
5. **Use cross-spawn for better cross-platform support**