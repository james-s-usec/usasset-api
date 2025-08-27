#!/bin/bash

# USAsset Quick Azure Update Script
# No complexity - just push your code changes to Azure

set -e

# Configuration
ACR_NAME=usassetacryf2eqktewmxp2
RG_NAME=useng-usasset-api-rg

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
    az acr build --registry $ACR_NAME --image backend:latest apps/backend/
    echo -e "${GREEN}✅ Backend image built!${NC}"
    
    echo -e "${BLUE}♻️  Restarting backend container...${NC}"
    az containerapp revision restart --name usasset-backend --resource-group $RG_NAME
    echo -e "${GREEN}✅ Backend deployed!${NC}"
    
    echo -e "${GREEN}🎉 Backend update complete!${NC}"
    echo "URL: https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io"
    ;;
    
  2)
    echo -e "${BLUE}📦 Building frontend...${NC}"
    az acr build --registry $ACR_NAME --image frontend:latest apps/frontend/
    echo -e "${GREEN}✅ Frontend image built!${NC}"
    
    echo -e "${BLUE}♻️  Restarting frontend container...${NC}"
    az containerapp revision restart --name usasset-frontend --resource-group $RG_NAME
    echo -e "${GREEN}✅ Frontend deployed!${NC}"
    
    echo -e "${GREEN}🎉 Frontend update complete!${NC}"
    echo "URL: https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io"
    ;;
    
  3)
    echo -e "${BLUE}📦 Building both applications...${NC}"
    
    # Build in parallel for speed
    (
      echo "Building backend..."
      az acr build --registry $ACR_NAME --image backend:latest apps/backend/ > /tmp/backend-build.log 2>&1
      echo -e "${GREEN}✅ Backend image built${NC}"
    ) &
    
    (
      echo "Building frontend..."
      az acr build --registry $ACR_NAME --image frontend:latest apps/frontend/ > /tmp/frontend-build.log 2>&1
      echo -e "${GREEN}✅ Frontend image built${NC}"
    ) &
    
    # Wait for both builds
    wait
    
    echo -e "${BLUE}♻️  Restarting containers...${NC}"
    az containerapp revision restart --name usasset-backend --resource-group $RG_NAME
    az containerapp revision restart --name usasset-frontend --resource-group $RG_NAME
    
    echo -e "${GREEN}🎉 Full deployment complete!${NC}"
    echo "Backend: https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io"
    echo "Frontend: https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io"
    ;;
    
  4)
    echo -e "${BLUE}♻️  Restarting containers without rebuild...${NC}"
    az containerapp revision restart --name usasset-backend --resource-group $RG_NAME
    az containerapp revision restart --name usasset-frontend --resource-group $RG_NAME
    echo -e "${GREEN}✅ Containers restarted!${NC}"
    ;;
    
  *)
    echo -e "${RED}Invalid choice. Exiting.${NC}"
    exit 1
    ;;
esac

echo "--------------------------------"
echo -e "${GREEN}✨ Deployment finished!${NC}"