#!/bin/bash

# USAsset Quick Azure Update Script
# No complexity - just push your code changes to Azure

set -e

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Configuration
ACR_NAME=usassetacryf2eqktewmxp2
RG_NAME=useng-usasset-api-rg

# Logging setup
LOG_DIR="/home/james/projects/usasset-api/.logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/azure-update_$TIMESTAMP.log"
mkdir -p "$LOG_DIR"

# Function to log with timestamp
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Capture all output to log file while still showing on screen
exec > >(tee -a "$LOG_FILE")
exec 2>&1

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_message "Starting Azure update script - User: $(whoami) - Directory: $(pwd)"

echo -e "${BLUE}🚀 USAsset Azure Quick Update${NC}"
echo "================================"
echo "What do you want to update?"
echo "1) Backend only"
echo "2) Frontend only" 
echo "3) Both applications"
echo "4) Restart containers (no rebuild)"
echo "--------------------------------"
read -p "Enter choice (1-4): " choice

case $choice in
  1)
    echo -e "${BLUE}📦 Building backend...${NC}"
    log_message "Building backend Docker image"
    # Generate version metadata for deployment tracking
    GIT_COMMIT=$(git rev-parse --short HEAD)
    BUILD_TIME=$(date +%Y-%m-%d_%H:%M:%S)
    # Build with Azure Container Registry - includes all Prisma migrations
    # Note: Migrations in prisma/migrations/ directory are copied into container
    # This ensures production database can be migrated during container startup
    az acr build --registry $ACR_NAME --image backend:latest --image backend:$GIT_COMMIT \
      --build-arg GIT_COMMIT=$GIT_COMMIT \
      --build-arg BUILD_TIME=$BUILD_TIME \
      --build-arg VERSION=$BUILD_TIME \
      --file /home/james/projects/usasset-api/apps/backend/Dockerfile.production \
      /home/james/projects/usasset-api/ 2>&1 | tee -a "$LOG_FILE"
    echo -e "${GREEN}✅ Backend image built!${NC}"
    
    echo -e "${BLUE}🚀 Deploying backend container...${NC}"
    log_message "Deploying backend container with new image"
    FRONTEND_URL="https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io"
    az containerapp update --name usasset-backend --resource-group $RG_NAME \
      --image $ACR_NAME.azurecr.io/backend:$GIT_COMMIT \
      --revision-suffix "deploy-$GIT_COMMIT" \
      --set-env-vars APP_VERSION=$GIT_COMMIT BUILD_TIME="$BUILD_TIME" CORS_ORIGIN=$FRONTEND_URL 2>&1 | tee -a "$LOG_FILE"
    echo -e "${GREEN}✅ Backend deployed!${NC}"
    
    echo -e "${GREEN}🎉 Backend update complete!${NC}"
    echo "URL: https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io"
    ;;
    
  2)
    echo -e "${BLUE}📦 Building frontend...${NC}"
    log_message "Building frontend Docker image"
    GIT_COMMIT=$(git rev-parse --short HEAD)
    BACKEND_URL="https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io"
    log_message "Using backend URL: $BACKEND_URL"
    az acr build --registry $ACR_NAME --image frontend:latest --image frontend:$GIT_COMMIT \
      --build-arg VITE_API_URL=$BACKEND_URL \
      --file /home/james/projects/usasset-api/apps/frontend/Dockerfile \
      /home/james/projects/usasset-api/ 2>&1 | tee -a "$LOG_FILE"
    echo -e "${GREEN}✅ Frontend image built!${NC}"
    
    echo -e "${BLUE}🚀 Deploying frontend container...${NC}"
    log_message "Deploying frontend container with new image"
    az containerapp update --name usasset-frontend --resource-group $RG_NAME \
      --image $ACR_NAME.azurecr.io/frontend:$GIT_COMMIT \
      --revision-suffix "deploy-$GIT_COMMIT" 2>&1 | tee -a "$LOG_FILE"
    echo -e "${GREEN}✅ Frontend deployed!${NC}"
    
    echo -e "${GREEN}🎉 Frontend update complete!${NC}"
    echo "URL: https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io"
    ;;
    
  3)
    echo -e "${BLUE}📦 Building both applications...${NC}"
    GIT_COMMIT=$(git rev-parse --short HEAD)
    BUILD_TIME=$(date +%Y-%m-%d_%H:%M:%S)
    
    # Build in parallel for speed
    (
      echo "Building backend..."
      az acr build --registry $ACR_NAME --image backend:latest --image backend:$GIT_COMMIT \
        --build-arg GIT_COMMIT=$GIT_COMMIT \
        --build-arg BUILD_TIME=$BUILD_TIME \
        --file /home/james/projects/usasset-api/apps/backend/Dockerfile.production \
        /home/james/projects/usasset-api/ >> "$LOG_FILE" 2>&1
      echo -e "${GREEN}✅ Backend image built${NC}"
    ) &
    
    (
      echo "Building frontend..."
      BACKEND_URL="https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io"
      az acr build --registry $ACR_NAME --image frontend:latest --image frontend:$GIT_COMMIT \
      --build-arg VITE_API_URL=$BACKEND_URL \
      --file /home/james/projects/usasset-api/apps/frontend/Dockerfile \
      /home/james/projects/usasset-api/ >> "$LOG_FILE" 2>&1
      echo -e "${GREEN}✅ Frontend image built${NC}"
    ) &
    
    # Wait for both builds
    wait
    
    echo -e "${BLUE}🚀 Deploying containers...${NC}"
    log_message "Deploying both containers with new images"
    FRONTEND_URL="https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io"
    az containerapp update --name usasset-backend --resource-group $RG_NAME \
      --image $ACR_NAME.azurecr.io/backend:$GIT_COMMIT \
      --revision-suffix "deploy-$GIT_COMMIT" \
      --set-env-vars APP_VERSION=$GIT_COMMIT BUILD_TIME="$BUILD_TIME" CORS_ORIGIN=$FRONTEND_URL 2>&1 | tee -a "$LOG_FILE"
    az containerapp update --name usasset-frontend --resource-group $RG_NAME \
      --image $ACR_NAME.azurecr.io/frontend:$GIT_COMMIT \
      --revision-suffix "deploy-$GIT_COMMIT" 2>&1 | tee -a "$LOG_FILE"
    
    echo -e "${GREEN}🎉 Full deployment complete!${NC}"
    echo "Backend: https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io"
    echo "Frontend: https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io"
    ;;
    
  4)
    echo -e "${BLUE}♻️  Restarting containers without rebuild...${NC}"
    log_message "Restarting containers without rebuild"
    REVISION=$(az containerapp revision list --name usasset-backend --resource-group $RG_NAME --query '[0].name' -o tsv)
    az containerapp revision restart --name usasset-backend --resource-group $RG_NAME --revision $REVISION 2>&1 | tee -a "$LOG_FILE"
    REVISION=$(az containerapp revision list --name usasset-frontend --resource-group $RG_NAME --query '[0].name' -o tsv)
    az containerapp revision restart --name usasset-frontend --resource-group $RG_NAME --revision $REVISION 2>&1 | tee -a "$LOG_FILE"
    echo -e "${GREEN}✅ Containers restarted!${NC}"
    ;;
    
  *)
    echo -e "${RED}Invalid choice. Exiting.${NC}"
    exit 1
    ;;
esac

echo "--------------------------------"
echo -e "${GREEN}✨ Deployment finished!${NC}"
log_message "Script completed - Choice: $choice"
echo ""
echo "📄 Full log saved to: $LOG_FILE"
echo "View logs: cat $LOG_FILE"