# Azure Deployment Scripts - Hardened Edition

## Overview
Production-grade deployment scripts for USAsset, built following Pragmatic Programmer principles:
- **DRY** - Shared library eliminates code duplication
- **Orthogonality** - Independent, composable functions
- **Defensive Programming** - Fail fast with clear error messages
- **Design by Contract** - Clear prerequisites and postconditions

## Scripts

### Core Library: `deploy-lib.sh`
Shared functions used by all deployment scripts:
- Error handling with line numbers
- Structured logging to `.logs/`
- Azure resource validation
- Git version tracking
- Health check utilities

### Main Scripts

#### `update-azure-v2.sh` - Primary Deployment Script
Hardened deployment with comprehensive validation:
- Prerequisites check (Azure CLI, git, commands)
- Uncommitted changes warning
- Azure resource verification
- Timeout handling
- Automatic verification prompt

#### `verify-deployment-v2.sh` - Health Verification
8-point verification system:
1. Backend API health
2. Database connectivity
3. Version matching
4. CORS configuration
5. Frontend accessibility
6. Container revisions
7. Log correlation
8. Response time checks

#### Legacy Scripts (kept for compatibility)
- `update-azure.sh` - Original deployment script
- `verify-deployment.sh` - Original verification script

## Usage

### Deploy Full Stack
```bash
./update-azure-v2.sh
# Select option 3 for both applications
```

### Deploy Backend Only
```bash
./update-azure-v2.sh
# Select option 1
```

### Verify Deployment
```bash
./verify-deployment-v2.sh
# Automatically runs 8 health checks
```

## Error Handling

All scripts implement defensive programming:
- **set -euo pipefail** - Exit on any error
- **trap ERR** - Capture errors with line numbers
- **Validation** - Check prerequisites before execution
- **Timeouts** - Prevent hanging operations
- **Logging** - All operations logged to `.logs/`

## Logs

All operations create timestamped logs in `.logs/`:
```
.logs/
├── azure-deployment_YYYYMMDD_HHMMSS.log
├── verify-deployment_YYYYMMDD_HHMMSS.log
└── [older logs...]
```

## Troubleshooting

### Script Exits Immediately
Check prerequisites:
```bash
az login                    # Login to Azure
git status                  # Ensure in git repo
```

### Deployment Timeout
Normal - Azure continues in background:
```bash
# Check status
az containerapp revision list -n usasset-backend -g useng-usasset-api-rg

# Run verification after 2-3 minutes
./verify-deployment-v2.sh
```

### Version Mismatch Warning
Deploy after committing:
```bash
git add -A
git commit -m "Deploy changes"
git push
./update-azure-v2.sh
```

### CORS Errors
Backend automatically configured, if persists:
```bash
az containerapp update --name usasset-backend \
  --resource-group useng-usasset-api-rg \
  --set-env-vars CORS_ORIGIN=https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io
```

## Best Practices

1. **Always verify after deployment** - Run verification script
2. **Commit before deploying** - Ensures version tracking
3. **Check logs on failure** - Detailed info in `.logs/`
4. **Use v2 scripts** - Hardened with better error handling

## Environment Variables

Scripts respect these environment variables:
- `ACR_NAME` - Azure Container Registry name
- `RG_NAME` - Resource group name
- `BACKEND_URL` - Backend URL
- `FRONTEND_URL` - Frontend URL

## Exit Codes

- `0` - Success
- `1` - General failure
- `2` - Prerequisites not met
- `130` - User cancelled (Ctrl+C)

## Contributing

When modifying scripts:
1. Update `deploy-lib.sh` for shared functionality
2. Maintain defensive programming practices
3. Add comprehensive logging
4. Update this README
5. Test both success and failure paths