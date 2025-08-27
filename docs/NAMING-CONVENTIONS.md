# USAsset-API Naming Conventions

## Resource Naming Pattern
All Azure resources use the pattern: `{projectName}-{resourceType}-{uniqueSuffix}` or `{projectName}{resourceType}{uniqueSuffix}`

### Variables
- **projectName**: `usasset` (3-10 chars, default)
- **uniqueSuffix**: `uniqueString(resourceGroup().id)` (13-char hash)
- **location**: `resourceGroup().location` (inherited from RG)

### Infrastructure Resources
| Resource Type | Naming Pattern | Example |
|---------------|----------------|---------|
| Container Registry | `{projectName}acr{uniqueSuffix}` | `usassetacrabcd1234567890` |
| Key Vault | `{projectName}-kv-{uniqueSuffix}` | `usasset-kv-abcd1234567890` |
| PostgreSQL Server | `{projectName}-db-{uniqueSuffix}` | `usasset-db-abcd1234567890` |
| Container Environment | `{projectName}-env-{uniqueSuffix}` | `usasset-env-abcd1234567890` |

### Application Resources
| Resource Type | Naming Pattern | Example |
|---------------|----------------|---------|
| Backend Container App | `{projectName}-backend` | `usasset-backend` |
| Frontend Container App | `{projectName}-frontend` | `usasset-frontend` |

## Resource Constraints
- **Container Registry**: Must be globally unique, alphanumeric only (no hyphens)
- **Key Vault**: Must be globally unique, 3-24 chars, alphanumeric + hyphens
- **PostgreSQL**: Must be globally unique within region
- **Container Apps**: Must be unique within Container Environment

## Image Naming
- **Backend Image**: `{acrLoginServer}/backend:latest`
- **Frontend Image**: `{acrLoginServer}/frontend:latest`

## Environment Variables
- **Backend**: `DATABASE_URL` (from secret)
- **Frontend**: `VITE_API_URL` (backend FQDN)

## Tags (Future Enhancement)
```bicep
var commonTags = {
  project: 'usasset-api'
  environment: 'production'
  owner: 'development-team'
  costCenter: 'engineering'
}
```