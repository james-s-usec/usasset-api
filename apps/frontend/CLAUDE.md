<!--
  USAsset Frontend Application Documentation
  
  Purpose: React frontend configuration, components, and deployment guide
  Audience: Frontend developers, UI/UX developers, DevOps engineers
  Last Updated: 2025-08-28
  Version: 2.1
  
  Key Sections:
  - Project Structure: Component organization and services
  - Environment Configuration: Vite build-time vs runtime variables
  - API Integration: Backend communication and CORS handling
  - Azure Deployment: Container Apps with static serving
  - Development: Local setup and debugging
-->

# USAsset Frontend

## ⚠️ CRITICAL: DO NOT MODIFY PACKAGE.JSON
**NEVER change package.json** without explicit user approval. This file contains:
- React 18 with specific tested versions
- Material-UI dependencies with exact versions
- Vite configuration and plugins
- ESLint and TypeScript settings

If you encounter dependency issues:
- Check tsconfig.json paths
- Verify vite.config.ts settings
- Review ESLint configuration
But DO NOT add or modify dependencies in package.json!

## Overview
React + TypeScript frontend built with Vite, configured for Azure Static Web Apps or Container Apps deployment.

## Project Structure
```
src/
├── assets/             # Static assets (images, icons)
├── components/         # React components
│   ├── DbStatus.tsx    # Database status indicator component
│   └── pipeline/       # ETL Pipeline UI (see pipeline/CLAUDE.md)
│       ├── components/     # Reusable pipeline UI components
│       ├── hooks/          # Pipeline-specific React hooks
│       ├── phases/         # Phase-specific components
│       ├── rules/          # Rules management UI (see rules/CLAUDE.md)
│       ├── types.ts        # Pipeline type definitions
│       └── utils/          # Pipeline utilities
├── config/             # Configuration
│   └── index.ts        # API URLs and environment config
├── services/           # API services
│   ├── api.ts          # Backend API client
│   ├── correlation-id.ts  # Correlation ID handling
│   └── logger.ts       # Frontend logging service
├── test/               # Test setup and utilities
├── App.tsx             # Main application component
├── App.css             # Application styles
├── index.css           # Global styles
├── main.tsx           # Application entry point
└── vite-env.d.ts      # TypeScript environment definitions
```

## Configuration

### Environment Variables
**Development** (.env file):
```bash
VITE_API_URL=http://localhost:3000
```

**Production** (.env.production):
```bash
VITE_API_URL=https://backend-<unique-id>.azurecontainerapps.io
```

### API Configuration
Located in `src/config/index.ts`:
- Reads from `import.meta.env.VITE_API_URL`
- Falls back to localhost:3000 for development
- Supports environment-specific builds

## Available Scripts
```bash
npm run dev       # Development server with hot reload (port 5173)
npm run build     # Build for production
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

## Key Features
- ⚛️ React 18.x with TypeScript
- ⚡ Vite for fast development and optimized builds
- 🎨 CSS modules support
- 🔧 ESLint configured
- 📦 Production-ready build optimization
- 🌐 Environment-based API configuration
- 🔒 CORS-ready for backend communication
- 🔄 **ETL Pipeline UI** with responsive design and real-time progress tracking
- ⚙️ **Rules Management Interface** with visual editor and testing capabilities
- 📱 **Mobile-First Design** with touch-friendly controls and adaptive layouts

## Dependencies
- **Framework**: React 18.x
- **Build Tool**: Vite 7.x
- **Language**: TypeScript 5.x
- **HTTP Client**: Native fetch (in api.ts)
- **Styling**: CSS modules

## Build & Deployment

### Development
```bash
npm run dev
# Runs on http://localhost:5173
# Hot module replacement enabled
# Proxies API calls to backend
```

### Production Build
```bash
npm run build
# Output in dist/ directory
# Optimized and minified
# Ready for static hosting
```

### Docker Build
```dockerfile
# Multi-stage build
# 1. Build stage with Node
# 2. Serve with nginx
```

## Azure Deployment Notes
- Can deploy as Static Web App or Container App
- Environment variables set in Azure Portal
- CORS must be configured on backend
- Health endpoint not required for frontend

## API Integration
The `services/api.ts` file provides:
- Centralized API configuration
- Error handling
- Type-safe request/response handling
- Environment-based URL switching

Example:
```typescript
import { apiClient } from './services/api';

const data = await apiClient.get('/endpoint');
```

## Common Tasks

### Add a new component
```bash
# Create new file in src/components/
# Export from index.ts for cleaner imports
```

### Change API endpoint
```bash
# Update .env file:
VITE_API_URL=https://new-backend-url.com
```

### Add environment variable
```bash
# 1. Add to .env: VITE_NEW_VAR=value
# 2. Access: import.meta.env.VITE_NEW_VAR
# 3. Add TypeScript type in vite-env.d.ts
```

### Debug API calls
```bash
# NEVER use console.log - use structured logging instead
# Check backend logs: curl "http://localhost:3000/logs?level=ERROR&limit=10"
# Trace requests: curl "http://localhost:3000/logs?correlationId=abc123"
# All frontend errors automatically sent to backend logs
```

## 🚫 LOGGING AND DEBUGGING - CONSOLE.LOG ELIMINATED

### Status: ✅ ZERO console.log statements (as of 2025-09-06)
All console.log debugging has been **completely eliminated** and replaced with structured logging that automatically appears in backend logs.

### Logging Pattern for New Code
```typescript
// ❌ NEVER DO THIS
console.error('Error occurred:', error);

// ✅ ALWAYS DO THIS
try {
  // API operation
} catch (err) {
  const { DebugLogger } = await import('../../../services/debug-logger');
  DebugLogger.logError('Component: Operation failed', err, {
    endpoint: '/api/endpoint',
    method: 'GET',
    context: 'componentName.functionName'
  });
  // User-facing error handling...
}
```

### Available DebugLogger Methods
```typescript
// Error logging (most common)
DebugLogger.logError(message, error, context);

// Info logging for successful operations
DebugLogger.logInfo(message, context);

// UI event tracking
DebugLogger.logUIEvent(event, details);
```

### Why This System is Better
- ✅ **All logs searchable** via `/logs` API endpoint
- ✅ **Correlation ID tracking** connects frontend actions to backend operations
- ✅ **Structured metadata** with full context
- ✅ **No more console.log spam** in browser DevTools
- ✅ **Automatic error capture** with stack traces
- ✅ **Performance timing** included automatically

### Implementation Examples
Files already updated following this pattern:
- `useRulesEditor.ts`: 3 console.error → DebugLogger.logError
- `useRulesLoader.ts`: 2 console.error → DebugLogger.logError

### Code Review Checklist
- [ ] No console.log statements in new code
- [ ] All try/catch blocks use DebugLogger.logError
- [ ] Error context includes relevant metadata
- [ ] Test logging works before committing

## TypeScript Configuration
- Strict mode enabled
- React JSX support
- Path aliases configured
- ES2022 target

## Performance Optimization
- Code splitting enabled
- Tree shaking in production
- CSS minification
- Asset optimization

## Testing
Currently no tests configured. To add:
```bash
npm install --save-dev vitest @testing-library/react
# Add test scripts to package.json
```