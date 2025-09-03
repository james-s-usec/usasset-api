<!--
  USAsset Project - Root Documentation
  
  Purpose: Primary documentation and navigation hub for USAsset monorepo
  Audience: Developers, DevOps engineers, project maintainers
  Last Updated: 2025-09-02
  Version: 2.1
  
  Quick Navigation:
  - Development Setup: See "Quick Start" section below
  - Backend API: ./apps/backend/CLAUDE.md
  - Frontend App: ./apps/frontend/CLAUDE.md  
  - Infrastructure: ./infra/CLAUDE.md
  - Deployment: ./docs/DEPLOYMENT_SOP.md
-->

# USAsset Project

## 🚫 ABSOLUTE RULE: NEVER MODIFY PACKAGE.JSON
**DO NOT TOUCH ANY package.json FILES IN THIS PROJECT**
- Root package.json orchestrates the monorepo
- Backend package.json has critical NestJS/Prisma configs
- Frontend package.json has exact React/MUI versions
- All scripts are carefully configured for CI/CD

**If you think you need to change package.json, YOU ARE WRONG.**
Instead:
- Fix tsconfig.json for TypeScript issues
- Update ESLint config for linting issues
- Adjust build configs for build issues
- But NEVER touch package.json

## ⚠️ Critical Configuration Note: Database Connection
**IMPORTANT**: The backend .env file MUST use Docker PostgreSQL credentials, not Prisma local dev server URLs!
- ✅ **Correct format**: `postgresql://dbadmin:localpassword123@localhost:5433/usasset`
- ❌ **Wrong format**: `prisma+postgres://localhost:51213/?api_key=...` (This is for Prisma's local dev server)
- Always check `docker-compose.yml` for the correct credentials
- Port 5433 on host maps to 5432 in container
- See `apps/backend/.env.example` for complete documentation with troubleshooting guide

## Project Structure
This is a monorepo with separate backend and frontend applications:

```
USAsset3/
├── apps/
│   ├── backend/         # NestJS API (see apps/backend/CLAUDE.md)
│   └── frontend/        # React SPA (see apps/frontend/CLAUDE.md)
├── infra/               # Azure Bicep templates (see infra/CLAUDE.md)
├── docs/                # Documentation
│   ├── Azure/           # Azure-specific guides and debug logs
│   ├── Docker/          # Docker-related documentation
│   └── DEPLOYMENT_SCRIPT_GUIDE.md  # Deployment script usage
└── CLAUDE.md           # This file
```

## Quick Links to Documentation
- 📘 **[Backend Documentation](./apps/backend/CLAUDE.md)** - NestJS API, configuration, logging
- 📗 **[Frontend Documentation](./apps/frontend/CLAUDE.md)** - React app, Vite config, API integration
- ⚡ **[CLI Documentation](./apps/cli/CLAUDE.md)** - CLI tool for backend management, zero coupling
- 🏗️ **[Infrastructure Documentation](./infra/CLAUDE.md)** - Azure Bicep templates, deployment guide
- 🚀 **[Deployment SOP](./docs/DEPLOYMENT_SOP.md)** - THE ONLY deployment guide (step-by-step, troubleshooting)
- 📋 **[CLI Usage Guide](./docs/CLI_USAGE_GUIDE.md)** - Complete CLI commands and workflow reference
- 🦆 **[Debugging Guide](./docs/DEBUGGING_GUIDE.md)** - Rubber duck debugging, troubleshooting commands
- 📚 **[Pragmatic Principles](./docs/PRAGMATIC_PRINCIPLES.md)** - Pragmatic Programmer principles applied

## Essential Commands
```bash
# Development
npm run dev                                    # Start both frontend & backend
npm run ci                                     # Run lint, typecheck, test, build (includes CLI)
npm run lint                                   # Check code style (all workspaces)
npm run typecheck                             # TypeScript validation (all workspaces)

# CLI Management (from apps/cli/ after npm run build)
./bin/usasset start                           # Start backend with health check
./bin/usasset health                          # Check backend health endpoint
./bin/usasset status                          # Show process PID and status
./bin/usasset stop                           # Graceful shutdown (SIGTERM)

# 🚀 DEPLOYMENT - See docs/DEPLOYMENT_SOP.md (THE ONLY GUIDE)
# Build locally, push to ACR, deploy. Step-by-step instructions included.

# Database
docker-compose up -d                          # Start local PostgreSQL
npx prisma migrate dev                        # Run migrations locally
npx prisma studio                             # Open database GUI

# Logs & Debugging
ls -lt .logs/*.log | head -5                 # View recent logs
tail -f .logs/verify-deployment_*.log        # Follow verification logs
```

## Quick Start

### Development
```bash
# Install dependencies (from root)
npm install

# Run both frontend and backend
npm run dev

# Or run separately:
cd apps/backend && npm run start:dev
cd apps/frontend && npm run dev
```

### Key URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health

### Deployment 

**📌 See `/docs/DEPLOYMENT_SOP.md` for the ONLY working deployment method**

Quick summary:
1. Build Docker images locally
2. Push to Azure Container Registry  
3. Deploy with `az containerapp update`
4. Verify with health endpoint

DO NOT use the deployment scripts - they have timeout issues.

## Environment Configuration Summary
Backend is configured for seamless local development and Azure production deployment:

### Key Configuration Points
- **Backend**: NestJS with validated env vars, Winston logging, Azure Key Vault ready
- **Frontend**: Vite with environment-based API URLs, build-time configuration
- **Infrastructure**: Azure Bicep templates for Container Apps, ACR, PostgreSQL, Key Vault
- **Monorepo**: npm workspaces for dependency management
- **Azure**: Container Apps with Key Vault integration and CORS configuration

See individual CLAUDE.md files in each directory for detailed configuration.

# Architecture Principles

## Architectural Rules

- Strict rules and simple patterns for maintaining clean, manageable code architecture
- Designed to keep complexity low and maintain clear boundaries between different parts of the system

### 1. One Thing Per File Rule
- Controllers only handle HTTP - no business logic
- Services only contain business rules - no data access
- Repositories only talk to database - no business logic
- If a file does multiple things, split it

### 2. Feature Boundaries Are Sacred
- Features can't directly import from other features
- Must go through shared services or events
- No circular dependencies between features
- If two features need to talk, create a shared service

### 3. Simple Data Flow
- Request → Controller → Service → Repository → Database
- Response ← Controller ← Service ← Repository ← Database
- Never skip layers
- Never go backwards

### 4. Complexity Budget
- Each service has max 3-5 public methods
- Each method has max 20-30 lines
- If bigger, split into smaller services
- If you can't explain it in one sentence, it's too complex

### 5. No Clever Code
- Explicit over implicit
- Boring code over smart code
- Copy-paste over premature abstraction
- If junior dev can't understand it, rewrite it

### 6. Dependencies Stay Shallow
- Features depend on shared, not each other
- Shared services stay small and focused
- Third-party libraries stay at the edges
- Core business logic has zero external dependencies

### 7. Test What Matters
- Unit test business logic in services
- Integration test the full request flow
- Don't test framework code or simple getters

**Guiding Principle**: Follow these rules religiously and complexity stays manageable.

## 🦆 Rubber Duck Debugging Protocol
**When stuck on a problem, use the rubber duck technique:**

### Pragmatic Commands Available:
- `duck [problem]` - Rubber duck debugging session
- `broken-windows` - Find technical debt to fix NOW
- `find-duplication` - Locate DRY violations
- `tracer [feature]` - Build minimal end-to-end slice
- `check-coupling [module]` - Analyze dependencies
- `estimate [task]` - PERT estimation technique
- `profile [operation]` - Performance analysis

### Command: `duck [problem]`
When you say "duck" followed by your problem, I will:
1. Ask you to explain what the code SHOULD do
2. Ask you to explain what it ACTUALLY does
3. Help you walk through it step-by-step
4. Point out assumptions you might be making
5. Not solve it for you - just listen and ask clarifying questions

### Example Usage:
```
User: duck - my API returns 500 but the logs show nothing
Claude: 🦆 *listening* - Let's start from the beginning. What endpoint are you calling and what should it return?
User: It's POST /users and should create a user...
Claude: 🦆 *nods* - Walk me through what happens when the request comes in. Start with the controller.
User: The controller validates the... OH WAIT, I'm not awaiting the async validation!
Claude: 🦆 *quack* - Glad I could help by listening!
```

### Why It Works (Pragmatic Programmer wisdom):
"By having to verbalize some of these assumptions, you may suddenly gain new insight into the problem."
The act of explaining forces you to:
- State hidden assumptions explicitly
- Think through the logic linearly
- Notice gaps in your mental model
- Catch silly mistakes you're blind to

## ⚠️ CRITICAL: NEVER MODIFY PACKAGE.JSON
**DO NOT TOUCH package.json FILES** - These are carefully configured with:
- Exact dependency versions for stability
- Specific scripts for CI/CD pipeline
- Workspace configurations for monorepo
- Custom build and test orchestration

If you think you need to modify package.json, STOP and ask the user first.
Common mistakes to avoid:
- Adding new dependencies without approval
- Changing script commands
- Modifying version numbers
- Adding or removing workspaces

## Deployment Notes

### ⚠️ Critical Deployment Rules
1. **ALWAYS run `./verify-deployment.sh` after ANY deployment**
2. **Script timeouts are NORMAL** - Azure continues in background (check with `az containerapp revision list`)
3. **All logs saved to `.logs/`** - Check there first for issues
4. **ALWAYS create verification log** - Document end-to-end testing (see VERIFICATION_LOG_2025-09-02.md as example)

### 📋 Latest Deployment Status
- **Version**: 1.1.0 (build 6936680) - 2025-09-02
- **Status**: ✅ FULLY VERIFIED AND OPERATIONAL  
- **Features**: User management + Project management with member assignments
- **Verification Log**: [VERIFICATION_LOG_2025-09-02.md](./VERIFICATION_LOG_2025-09-02.md)

### Common Issues & Fixes
| Issue | Solution |
|-------|----------|
| Script timeout | Normal - deployment continues, run verification after 2-3 mins |
| Version mismatch warning | Deploy after committing: `git commit -am "message" && git push` |
| CORS errors | Backend auto-configured, if persists check CORS_ORIGIN env var |
| Database connection failed | Check Key Vault: `az keyvault secret show --vault-name usasset-kv-yf2eqktewmxp2 --name database-connection-string` |
| Frontend not updating | Follow DEPLOYMENT_SOP.md - rebuild and deploy frontend |

## Miscellaneous Notes
multiple MCP servers configured. - review the files here: "\\wsl.localhost\Ubuntu\home\swansonj\.config\claude\mcp" if having issues. 

## Configuration and User Memory Notes
- To add configuration or user memory, edit the CLAUDE.md file directly
- New memories should be added as bullet points under appropriate sections
- If no suitable section exists, create a new section to categorize the memory
- Always append new information, never replace existing content

## STOP BEING AN IDIOT RULES

1. **NO NEW FILES OR SCRIPTS**
   - If something can be done with existing tools, USE THEM
   - Don't create test scripts - just run the test
   - Don't create seed scripts - just run the SQL
   - Don't create helper scripts - just run the command

2. **THINK BEFORE ACTING**
   - Ask: "Can I do this with what already exists?"
   - Ask: "Is this solving a real problem or creating busy work?"
   - Ask: "Would a human developer create a new file for this?"

3. **WHEN DEBUGGING**
   - First: Check what's actually in the database
   - Second: Run the actual failing command and read the error
   - Third: Fix ONLY the specific error, nothing else
   - Never: Create "comprehensive solutions" for simple problems

4. **BE DIRECT**
   - User says "test the API" → Run curl command
   - User says "add test data" → Run SQL insert
   - User says "fix the error" → Fix that specific error only
   - Don't interpret "fix" as "redesign everything"

5. **EXISTING TOOLS FIRST**
   - Have a CLI? Use it
   - Have curl? Use it
   - Have SQL access? Use it
   - Don't wrap existing tools in new scripts

6. **IF UNSURE, ASK**
   - "Do you want me to create a new script or just run the command?"
   - "Should I fix just this error or refactor the whole thing?"
   - Default to doing LESS, not MORE