#!/bin/bash

# Deploy USAsset to Azure Container Apps
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_DIR="/home/james/projects/usasset-api/.logs"
LOG_FILE="$LOG_DIR/azure-deploy-$TIMESTAMP.log"

mkdir -p $LOG_DIR

# Function to output to both console and log file
output() {
    echo "$@" | tee -a "$LOG_FILE"
}

output "🚀 Starting Azure Deployment..."
output "=================================="
output "📝 Logging to: $LOG_FILE"
output ""

# Configuration
RESOURCE_GROUP="useng-usasset-api-rg"
ACR_NAME="usassetacryf2eqktewmxp2"
REGISTRY_URL="$ACR_NAME.azurecr.io"

# Parse arguments
DEPLOY_TARGET="${1:-both}"  # backend, frontend, or both

output "🎯 Deployment target: $DEPLOY_TARGET"
output ""

# Login to Azure Container Registry
output "🔐 Logging into Azure Container Registry..."
az acr login --name $ACR_NAME 2>&1 | tee -a "$LOG_FILE"

# Function to build and push image
deploy_app() {
    local APP_NAME=$1
    local DOCKERFILE=$2
    local APP_PATH="/home/james/projects/usasset-api/apps/$APP_NAME"
    
    output ""
    output "📦 Building $APP_NAME..."
    output "--------------------------"
    
    cd $APP_PATH
    
    # Build Docker image
    output "🔨 Building Docker image..."
    docker build -t $REGISTRY_URL/$APP_NAME:latest -f $DOCKERFILE . 2>&1 | tee -a "$LOG_FILE"
    
    # Push to registry
    output "⬆️  Pushing to registry..."
    docker push $REGISTRY_URL/$APP_NAME:latest 2>&1 | tee -a "$LOG_FILE"
    
    # Update Container App
    output "🔄 Updating Container App..."
    az containerapp update \
        --name usasset-$APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --image $REGISTRY_URL/$APP_NAME:latest \
        --query "{Name:name, LatestRevision:properties.latestRevisionName, FQDN:properties.configuration.ingress.fqdn}" \
        -o json 2>&1 | tee -a "$LOG_FILE"
    
    output "✅ $APP_NAME deployed successfully!"
}

# Deploy based on target
if [ "$DEPLOY_TARGET" = "backend" ] || [ "$DEPLOY_TARGET" = "both" ]; then
    deploy_app "backend" "Dockerfile.production"
fi

if [ "$DEPLOY_TARGET" = "frontend" ] || [ "$DEPLOY_TARGET" = "both" ]; then
    deploy_app "frontend" "Dockerfile"
fi

output ""
output "=================================="
output "📊 Deployment Summary:"
output ""

# Show deployment status
output "🔍 Checking deployment status..."
az containerapp list \
    --resource-group $RESOURCE_GROUP \
    --query "[?starts_with(name, 'usasset')].{Name:name, State:properties.provisioningState, URL:properties.configuration.ingress.fqdn}" \
    -o table 2>&1 | tee -a "$LOG_FILE"

output ""
output "🌐 Application URLs:"
output "   Backend:  https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io"
output "   Frontend: https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io"
output ""
output "✅ Deployment completed! Full log: $LOG_FILE"
output ""
output "📝 Next steps:"
output "   1. Check application health: curl https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io/health"
output "   2. View logs: az containerapp logs show -n usasset-backend -g $RESOURCE_GROUP --tail 50"
output "   3. Check status: /home/james/projects/usasset-api/utilities/scripts/check-azure-status.sh"