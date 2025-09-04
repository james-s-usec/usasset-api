# Azure Storage Setup for File Upload

## Required Azure Resources

### 1. Storage Account
```bash
# Create storage account
az storage account create \
  --name usassetstorageaccount \
  --resource-group useng-usasset-api-rg \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2

# Get connection string
az storage account show-connection-string \
  --name usassetstorageaccount \
  --resource-group useng-usasset-api-rg \
  --output tsv
```

### 2. Blob Container
```bash
# Create container for uploads
az storage container create \
  --name uploads \
  --account-name usassetstorageaccount \
  --public-access off
```

### 3. Add Secrets to Key Vault
```bash
# Store connection string in existing Key Vault
az keyvault secret set \
  --vault-name usasset-kv-yf2eqktewmxp2 \
  --name azure-storage-connection-string \
  --value "DefaultEndpointsProtocol=https;AccountName=..."

# Store container name
az keyvault secret set \
  --vault-name usasset-kv-yf2eqktewmxp2 \
  --name azure-storage-container-name \
  --value "uploads"
```

### 4. Container App Configuration
```bash
# Update backend container app with Key Vault references
az containerapp update \
  --name backend \
  --resource-group useng-usasset-api-rg \
  --set-env-vars \
    "AZURE_STORAGE_CONNECTION_STRING=secretref:azure-storage-connection-string" \
    "AZURE_STORAGE_CONTAINER_NAME=secretref:azure-storage-container-name"
```

## Development Setup

Add to `apps/backend/.env`:
```
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_CONTAINER_NAME=uploads
```

## Verification Commands
```bash
# Test storage account
az storage blob list \
  --container-name uploads \
  --account-name usassetstorageaccount

# Verify Key Vault secrets
az keyvault secret show \
  --vault-name usasset-kv-yf2eqktewmxp2 \
  --name azure-storage-connection-string
```