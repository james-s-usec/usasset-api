# USAsset Frontend

## Overview
React + TypeScript frontend built with Vite, configured for Azure Static Web Apps or Container Apps deployment.

## Project Structure
```
src/
├── assets/             # Static assets (images, icons)
├── config/             # Configuration
│   └── index.ts        # API URLs and environment config
├── services/           # API services
│   └── api.ts          # Backend API client
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
# Open browser DevTools
# Network tab shows all API requests
# Console shows any errors
```

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