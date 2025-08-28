<!--
  USAsset Project - Root Documentation
  
  Purpose: Primary documentation and navigation hub for USAsset monorepo
  Audience: Developers, DevOps engineers, project maintainers
  Last Updated: 2025-08-28
  Version: 2.0
  
  Quick Navigation:
  - Development Setup: See "Quick Start" section below
  - Backend API: ./apps/backend/CLAUDE.md
  - Frontend App: ./apps/frontend/CLAUDE.md  
  - Infrastructure: ./infra/CLAUDE.md
  - Deployment: ./docs/DEPLOYMENT_SCRIPT_GUIDE.md
-->

# USAsset Project

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
- 🏗️ **[Infrastructure Documentation](./infra/CLAUDE.md)** - Azure Bicep templates, deployment guide

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

## Miscellaneous Notes
multiple MCP servers configured. - review the files here: "\\wsl.localhost\Ubuntu\home\swansonj\.config\claude\mcp" if having issues. 

## Configuration and User Memory Notes
- To add configuration or user memory, edit the CLAUDE.md file directly
- New memories should be added as bullet points under appropriate sections
- If no suitable section exists, create a new section to categorize the memory
- Always append new information, never replace existing content