# Deprecated Bicep Templates

⚠️ **THESE BICEP TEMPLATES ARE DEPRECATED - DO NOT USE** ⚠️

## Why These Templates Were Deprecated

### Missing Parameters File
- **Issue:** Templates expect `parameters.json` that doesn't exist
- **Impact:** Cannot deploy without manual parameter creation

### Resource Name Mismatches
- **Issue:** Template resource names may not match current Azure resources
- **Impact:** Deployments would fail or create duplicate resources

### Superseded by SOP
- **Issue:** We now use manual `az containerapp update` commands via SOP
- **Impact:** Bicep templates are no longer maintained or tested

### Complexity vs Value
- **Issue:** Bicep adds complexity for infrastructure that rarely changes
- **Impact:** More overhead with little benefit over direct az commands

## What to Use Instead

**📋 Use the Standard Operating Procedure (SOP):**
- **File:** `/docs/DEPLOYMENT_SOP.md`
- **Method:** Direct `az containerapp update` commands
- **Benefits:** Simple, reliable, battle-tested

## Current Azure Resources

The following resources exist and are managed manually:
- **Resource Group:** `useng-usasset-api-rg`
- **ACR:** `usassetacryf2eqktewmxp2.azurecr.io`
- **Backend App:** `usasset-backend`
- **Frontend App:** `usasset-frontend`
- **Database:** PostgreSQL Flexible Server
- **Key Vault:** `usasset-kv-yf2eqktewmxp2`

## Migration Path

If you need to recreate infrastructure:

1. **For app updates:** Use `/docs/DEPLOYMENT_SOP.md`
2. **For infrastructure changes:** Use Azure Portal or az CLI directly
3. **For infrastructure as code:** Create new Bicep templates based on current working resources

## When Were These Deprecated?

**Date:** September 2, 2025  
**Reason:** Missing dependencies, resource name mismatches, superseded by SOP  
**Replacement:** `/docs/DEPLOYMENT_SOP.md` for deployments, manual Azure resources

---
**DO NOT USE THESE TEMPLATES** - They will fail to deploy.