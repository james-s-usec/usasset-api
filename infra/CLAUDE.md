<!--
  USAsset Infrastructure Documentation
  
  Purpose: Azure Bicep templates and deployment infrastructure guide
  Audience: DevOps engineers, cloud architects, infrastructure developers
  Last Updated: 2025-08-28
  Version: 1.0
  
  Key Sections:
  - Template Overview: Bicep file purposes and dependencies
  - Deployment Architecture: Azure resource relationships
  - Configuration: Environment variables and secrets management
  - Operations: Common deployment and troubleshooting tasks
  - Integration: How infrastructure connects with application code
-->

# USAsset Infrastructure

## Overview
Azure Bicep templates for deploying USAsset API infrastructure and applications to Azure Container Apps.

## Project Structure
```
infra/
├── infrastructure.bicep     # Core infrastructure (ACR, DB, Key Vault, Container Environment)
├── complete-deploy.bicep    # Complete application deployment (Backend + Frontend)
├── simple-deploy.bicep      # Simplified deployment template  
├── database-only.bicep      # Database-only deployment
└── CLAUDE.md               # This documentation
```

## Deployment Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │────│   Backend API    │────│   PostgreSQL    │
│  Container App  │    │  Container App   │    │ Flexible Server │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         └────────────────────────┼───────────────────────┘
                                  │
                    ┌─────────────────────────┐
                    │    Azure Key Vault     │
                    │  (Database secrets)    │
                    └─────────────────────────┘
```

## Templates Overview

### 1. infrastructure.bicep
**Purpose**: Creates foundational Azure resources  
**Resources**:
- Azure Container Registry (ACR) - `usassetacryf2eqktewmxp2`
- PostgreSQL Flexible Server - Database with admin user
- Azure Key Vault - For storing database connection strings
- Container Apps Environment - For hosting applications

**Usage**:
```bash
az deployment group create \
  --resource-group useng-usasset-api-rg \
  --template-file infra/infrastructure.bicep \
  --parameters dbAdminPassword='<SECURE_PASSWORD>'
```

### 2. complete-deploy.bicep  
**Purpose**: Deploys frontend and backend applications with full configuration  
**Features**:
- Backend Container App with environment variables
- Frontend Container App with dynamic API URL
- CORS configuration between frontend/backend
- Health check probes and scaling rules
- Key Vault secret integration

**Prerequisites**: Infrastructure must exist (run infrastructure.bicep first)

**Usage**:
```bash
az deployment group create \
  --resource-group useng-usasset-api-rg \
  --template-file infra/complete-deploy.bicep \
  --parameters @infra/parameters.json
```

### 3. simple-deploy.bicep
**Purpose**: Minimal deployment template for testing

### 4. database-only.bicep
**Purpose**: Database-specific deployment for isolated testing

## Naming Convention
All resources follow the pattern: `{projectName}-{resourceType}-{uniqueString}`

**Examples**:
- ACR: `usassetacryf2eqktewmxp2` 
- Backend App: `usasset-backend`
- Frontend App: `usasset-frontend`
- Database: `usasset-db-yf2eqktewmxp2`
- Key Vault: `usasset-kv-yf2eqktewmxp2`

## Environment Variables

### Backend Container App
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db    # From Key Vault
CORS_ORIGIN=https://frontend-url                   # Frontend origin for CORS
APP_VERSION=<git-commit-hash>                      # Git commit for version tracking
BUILD_TIME=<build-timestamp>                      # Build timestamp
```

### Frontend Container App
```bash
VITE_API_URL=https://backend-url                   # Backend API URL (build-time)
```

## Key Vault Integration
Database secrets are automatically stored in Key Vault and referenced by Container Apps.

**Secret References**:
- `database-connection-string`: Full PostgreSQL connection URL
- `db-password`: Database admin password

## Resource Groups
**Primary**: `useng-usasset-api-rg`
- Contains all USAsset infrastructure
- Located in East US region
- Managed through Azure CLI and Bicep

## Common Operations

### Deploy Infrastructure Only
```bash
# Create core resources (ACR, DB, Key Vault, Container Environment)
az deployment group create \
  --resource-group useng-usasset-api-rg \
  --template-file infra/infrastructure.bicep \
  --parameters dbAdminPassword='YourSecurePassword123!'
```

### Deploy Applications
```bash
# Deploy both frontend and backend after infrastructure exists
az deployment group create \
  --resource-group useng-usasset-api-rg \
  --template-file infra/complete-deploy.bicep \
  --parameters acrName='usassetacryf2eqktewmxp2' \
               dbServerName='usasset-db-yf2eqktewmxp2' \
               containerEnvName='usasset-env-yf2eqktewmxp2' \
               keyVaultName='usasset-kv-yf2eqktewmxp2'
```

### View Deployment Status
```bash
# Check deployment history
az deployment group list --resource-group useng-usasset-api-rg --output table

# Get specific deployment details  
az deployment group show --resource-group useng-usasset-api-rg --name <deployment-name>
```

### Update Container Apps
**Prefer using deployment script**: `utilities/deployment/update-azure.sh`

Manual updates:
```bash
# Update backend with new image
az containerapp update --name usasset-backend --resource-group useng-usasset-api-rg \
  --image usassetacryf2eqktewmxp2.azurecr.io/backend:latest

# Update frontend with new image  
az containerapp update --name usasset-frontend --resource-group useng-usasset-api-rg \
  --image usassetacryf2eqktewmxp2.azurecr.io/frontend:latest
```

## Security Configuration

### Container Registry
- Admin user enabled for deployment automation
- Private endpoints not configured (public access)
- Managed identity integration planned

### Key Vault  
- Stores database connection strings securely
- Access policies configured for Container Apps
- Secret rotation not automated

### Container Apps
- System-assigned managed identities
- No custom domains or certificates
- Default HTTPS termination

## Monitoring & Diagnostics

### Available Endpoints
- **Backend Health**: `https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/health`
- **Frontend**: `https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io`
- **Database Health**: `https://usasset-backend.../health/db`

### Logging
```bash
# Backend logs
az containerapp logs show --name usasset-backend --resource-group useng-usasset-api-rg --tail 50

# Frontend logs  
az containerapp logs show --name usasset-frontend --resource-group useng-usasset-api-rg --tail 50
```

### Scaling
- Backend: 1-10 replicas based on HTTP requests
- Frontend: 1-5 replicas based on HTTP requests
- Database: Single instance (not scalable in current config)

## Troubleshooting

### Common Issues
1. **Database Connection Failures**
   - Check Key Vault for `database-connection-string`
   - Verify PostgreSQL server is running
   - Test connection string encoding

2. **Container App Won't Start**
   - Check container logs: `az containerapp logs show`
   - Verify ACR image exists and is accessible
   - Check environment variable configuration

3. **CORS Errors**
   - Verify `CORS_ORIGIN` is set on backend
   - Check frontend URL matches exactly
   - Test with curl: `curl -I -H "Origin: <frontend-url>" <backend-url>`

### Recovery Procedures
1. **Infrastructure Recovery**: Re-run `infrastructure.bicep`
2. **Application Recovery**: Re-run `complete-deploy.bicep`  
3. **Quick Recovery**: Use `utilities/deployment/update-azure.sh`

## Deployment Script Integration
The Bicep templates work with `utilities/deployment/update-azure.sh`:
- Script builds and pushes container images to ACR
- Script uses `az containerapp update` to deploy new images
- Script handles environment variable configuration
- Script provides options for backend-only, frontend-only, or full deployment

## Prerequisites
- Azure CLI installed and authenticated
- Sufficient Azure permissions (Contributor on resource group)
- Docker (for local container builds)
- Git (for commit hash generation)

## Related Documentation
- **[Backend Setup](../apps/backend/CLAUDE.md)** - NestJS API configuration
- **[Frontend Setup](../apps/frontend/CLAUDE.md)** - React app configuration  
- **[Deployment Script](../docs/DEPLOYMENT_SCRIPT_GUIDE.md)** - Script usage guide
- **[Azure Debug Guide](../docs/Azure/AZURE-DEPLOYMENT-GUIDE.md)** - Troubleshooting guide

## Architecture Principles
Follows project's architectural rules:
- **One Thing Per File**: Each Bicep template has single responsibility
- **Feature Boundaries**: Infrastructure isolated from application code
- **Simple Data Flow**: Clear resource dependencies and references
- **No Clever Code**: Explicit parameter names and clear resource definitions