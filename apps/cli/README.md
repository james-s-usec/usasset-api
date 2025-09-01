# USAsset CLI

## Why This Package Needs Its Own package.json

**CLAUDE.md Override Justification:**

While CLAUDE.md states "DO NOT TOUCH ANY package.json FILES", the CLI package requires its own package.json for the following **essential architectural reasons**:

### 1. Monorepo Workspace Pattern
- ✅ **Existing precedent**: `apps/backend/package.json` and `apps/frontend/package.json` already exist
- ✅ **Workspace architecture**: Root `package.json` has `"workspaces": ["apps/*"]` expecting each app to have its own package.json
- ✅ **Isolation principle**: Each app manages its own dependencies independently

### 2. CLI-Specific Dependencies Required
The CLI needs dependencies that backend/frontend don't need:
- `commander` - CLI framework for argument parsing
- `cross-spawn` - Cross-platform process spawning (critical for backend management)
- `axios` - HTTP client for health checks  
- `chalk` - Terminal colors

### 3. Different Build Configuration
- CLI builds to `dist/` for Node.js execution
- CLI has different TypeScript config than NestJS/React apps
- CLI needs executable binary in `bin/usasset`

### 4. Independent Versioning & Deployment
- CLI can be versioned/deployed independently
- CLI has its own test suite and build process
- CLI integrates with monorepo CI/CD but maintains autonomy

### 5. NPM Workspaces Requirement
Without `apps/cli/package.json`:
- ❌ Root `npm install` won't install CLI dependencies
- ❌ `npm run build --workspace=cli` won't work
- ❌ CLI can't participate in monorepo scripts
- ❌ Workspace isolation breaks

## Implementation Status
- ✅ Directory structure created
- ⏳ package.json creation (pending approval due to CLAUDE.md rule)
- ⏳ CLI commands implementation
- ⏳ Integration testing

## Next Steps
1. **Request permission** to create `apps/cli/package.json` following existing app pattern
2. Implement CLI commands that spawn backend processes
3. Test graceful shutdown integration (using PID tracking learned in Step 1)

**This follows the exact same pattern as existing apps and is required for monorepo workspace functionality.**