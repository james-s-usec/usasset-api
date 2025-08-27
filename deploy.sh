#!/bin/bash

# USAsset API Deployment Script
# Follows the clean 3-phase deployment pattern from SOP

set -e

# Setup logging
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR=".logs"
LOG_FILE="$LOG_DIR/deployment_$TIMESTAMP.log"

mkdir -p $LOG_DIR

# Function to log both to console and file
log() {
    echo "$1" | tee -a "$LOG_FILE"
}

log "🚀 USAsset API Deployment Starting..."
log "📝 Logging to: $LOG_FILE"

# Check if infrastructure already exists
INFRA_EXISTS=$(az deployment group show --resource-group useng-usasset-api-rg --name infrastructure --query "properties.provisioningState" -o tsv 2>/dev/null || echo "NotFound")

if [ "$INFRA_EXISTS" = "Succeeded" ]; then
    log "♻️  Infrastructure already exists, skipping Phase 1"
    # Get existing outputs
    ACR_NAME=$(az deployment group show --resource-group useng-usasset-api-rg --name infrastructure --query properties.outputs.acrName.value -o tsv)
    DB_NAME=$(az deployment group show --resource-group useng-usasset-api-rg --name infrastructure --query properties.outputs.dbServerName.value -o tsv)
    ENV_NAME=$(az deployment group show --resource-group useng-usasset-api-rg --name infrastructure --query properties.outputs.containerEnvName.value -o tsv)
    ACR_SERVER=$(az deployment group show --resource-group useng-usasset-api-rg --name infrastructure --query properties.outputs.acrLoginServer.value -o tsv)
    
    log "📋 Using existing infrastructure:"
    log "   ACR: $ACR_NAME"
    log "   Database: $DB_NAME" 
    log "   Container Environment: $ENV_NAME"ca
    
    # For updates, prompt for password or use KeyVault
    read -s -p "Enter existing database password: " DB_PASSWORD
    log ""
    
    SKIP_INFRA=true
else
    log "🆕 No existing infrastructure found"
    # Generate secure password for new deployment
    DB_PASSWORD=$(openssl rand -base64 32)
    log "✅ Generated secure database password"
    SKIP_INFRA=false
fi

# Phase 1: Deploy Infrastructure (if needed)
if [ "$SKIP_INFRA" = false ]; then
    log ""
    log "📦 Phase 1: Deploying Infrastructure..."
    az deployment group create \
      --resource-group useng-usasset-api-rg \
      --name infrastructure \
      --template-file infra/infrastructure.bicep \
      --parameters dbAdminPassword="$DB_PASSWORD"

    if [ $? -ne 0 ]; then
        log "❌ Infrastructure deployment failed"
        exit 1
    fi

    log "✅ Infrastructure deployed successfully"

    # Get infrastructure outputs
    ACR_NAME=$(az deployment group show --resource-group useng-usasset-api-rg --name infrastructure --query properties.outputs.acrName.value -o tsv)
    DB_NAME=$(az deployment group show --resource-group useng-usasset-api-rg --name infrastructure --query properties.outputs.dbServerName.value -o tsv)
    ENV_NAME=$(az deployment group show --resource-group useng-usasset-api-rg --name infrastructure --query properties.outputs.containerEnvName.value -o tsv)
    ACR_SERVER=$(az deployment group show --resource-group useng-usasset-api-rg --name infrastructure --query properties.outputs.acrLoginServer.value -o tsv)

    log "📋 Infrastructure Details:"
    log "   ACR: $ACR_NAME"
    log "   Database: $DB_NAME" 
    log "   Container Environment: $ENV_NAME"
fi

# Phase 2: Build and Push Images
log ""
log "🔨 Phase 2: Building and Pushing Images..."

log "   Building backend image..."
az acr build --registry $ACR_NAME --image backend:latest apps/backend/

if [ $? -ne 0 ]; then
    log "❌ Backend build failed"
    exit 1
fi

log "   Building frontend image..."
az acr build --registry $ACR_NAME --image frontend:latest apps/frontend/

if [ $? -ne 0 ]; then
    log "❌ Frontend build failed"
    exit 1
fi

log "✅ Images built and pushed successfully"

# Phase 3: Deploy Applications
log ""
log "🚢 Phase 3: Deploying Applications..."
az deployment group create \
  --resource-group useng-usasset-api-rg \
  --name applications \
  --template-file infra/simple-deploy.bicep \
  --parameters acrName=$ACR_NAME dbServerName=$DB_NAME containerEnvName=$ENV_NAME dbPassword="$DB_PASSWORD"

if [ $? -ne 0 ]; then
    log "❌ Application deployment failed"
    exit 1
fi

# Get application URLs
BACKEND_URL=$(az deployment group show --resource-group useng-usasset-api-rg --name applications --query properties.outputs.backendUrl.value -o tsv)
FRONTEND_URL=$(az deployment group show --resource-group useng-usasset-api-rg --name applications --query properties.outputs.frontendUrl.value -o tsv)

log ""
log "🎉 Deployment Complete!"
log "📱 Application URLs:"
log "   Backend:  $BACKEND_URL"
log "   Frontend: $FRONTEND_URL"
log ""
log "🔑 Database Password: $DB_PASSWORD"
log "   (Save this password securely!)"