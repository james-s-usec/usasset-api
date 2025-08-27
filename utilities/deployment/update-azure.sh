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
LOG_DIR="/home/swansonj/projects/USAsset3/.logs"
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
    az acr build --registry $ACR_NAME --image backend:latest /home/swansonj/projects/USAsset3/apps/backend/ 2>&1 | tee -a "$LOG_FILE"
    echo -e "${GREEN}✅ Backend image built!${NC}"
    
    echo -e "${BLUE}♻️  Restarting backend container...${NC}"
    log_message "Restarting backend container"
    az containerapp revision restart --name usasset-backend --resource-group $RG_NAME 2>&1 | tee -a "$LOG_FILE"
    echo -e "${GREEN}✅ Backend deployed!${NC}"
    
    echo -e "${GREEN}🎉 Backend update complete!${NC}"
    echo "URL: https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io"
    ;;
    
  2)
    echo -e "${BLUE}📦 Building frontend...${NC}"
    log_message "Building frontend Docker image"
    az acr build --registry $ACR_NAME --image frontend:latest /home/swansonj/projects/USAsset3/apps/frontend/ 2>&1 | tee -a "$LOG_FILE"
    echo -e "${GREEN}✅ Frontend image built!${NC}"
    
    echo -e "${BLUE}♻️  Restarting frontend container...${NC}"
    log_message "Restarting frontend container"
    az containerapp revision restart --name usasset-frontend --resource-group $RG_NAME 2>&1 | tee -a "$LOG_FILE"
    echo -e "${GREEN}✅ Frontend deployed!${NC}"
    
    echo -e "${GREEN}🎉 Frontend update complete!${NC}"
    echo "URL: https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io"
    ;;
    
  3)
    echo -e "${BLUE}📦 Building both applications...${NC}"
    
    # Build in parallel for speed
    (
      echo "Building backend..."
      az acr build --registry $ACR_NAME --image backend:latest /home/swansonj/projects/USAsset3/apps/backend/ >> "$LOG_FILE" 2>&1
      echo -e "${GREEN}✅ Backend image built${NC}"
    ) &
    
    (
      echo "Building frontend..."
      az acr build --registry $ACR_NAME --image frontend:latest /home/swansonj/projects/USAsset3/apps/frontend/ >> "$LOG_FILE" 2>&1
      echo -e "${GREEN}✅ Frontend image built${NC}"
    ) &
    
    # Wait for both builds
    wait
    
    echo -e "${BLUE}♻️  Restarting containers...${NC}"
    log_message "Restarting both containers"
    az containerapp revision restart --name usasset-backend --resource-group $RG_NAME 2>&1 | tee -a "$LOG_FILE"
    az containerapp revision restart --name usasset-frontend --resource-group $RG_NAME 2>&1 | tee -a "$LOG_FILE"
    
    echo -e "${GREEN}🎉 Full deployment complete!${NC}"
    echo "Backend: https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io"
    echo "Frontend: https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io"
    ;;
    
  4)
    echo -e "${BLUE}♻️  Restarting containers without rebuild...${NC}"
    log_message "Restarting containers without rebuild"
    az containerapp revision restart --name usasset-backend --resource-group $RG_NAME 2>&1 | tee -a "$LOG_FILE"
    az containerapp revision restart --name usasset-frontend --resource-group $RG_NAME 2>&1 | tee -a "$LOG_FILE"
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