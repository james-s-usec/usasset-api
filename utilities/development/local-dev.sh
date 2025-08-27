#!/bin/bash

# USAsset Local Development Helper
# Quick commands for local Docker development

set -e

# Get script directory and use absolute paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Logging setup
LOG_DIR="/home/swansonj/projects/USAsset3/.logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/local-dev_$TIMESTAMP.log"
mkdir -p "$LOG_DIR"

# Function to log with timestamp
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Capture all output to log file while still showing on screen
exec > >(tee -a "$LOG_FILE")
exec 2>&1

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_message "Starting local development script - User: $(whoami) - Directory: $(pwd)"

echo -e "${BLUE}🐳 USAsset Local Docker Development${NC}"
echo "===================================="
echo "1) Start full stack (Docker Compose)"
echo "2) Start database only (for local dev)"
echo "3) Stop all containers"
echo "4) View logs"
echo "5) Reset database"
echo "6) Run Prisma migrations"
echo "7) Connect to database (psql)"
echo "------------------------------------"
read -p "Enter choice (1-7): " choice

case $choice in
  1)
    echo -e "${BLUE}🚀 Starting full stack...${NC}"
    docker-compose up -d 2>&1 | tee -a "$LOG_FILE"
    echo -e "${GREEN}✅ Full stack running!${NC}"
    echo "  Frontend: http://localhost"
    echo "  Backend:  http://localhost:3000"
    echo "  Database: localhost:5432"
    ;;
    
  2)
    echo -e "${BLUE}🗄️  Starting PostgreSQL only...${NC}"
    docker-compose -f docker-compose.dev.yml up -d 2>&1 | tee -a "$LOG_FILE"
    echo -e "${GREEN}✅ Database running!${NC}"
    echo "  Connection: postgresql://dbadmin:localpassword123@localhost:5432/usasset"
    echo ""
    echo -e "${YELLOW}Now run locally:${NC}"
    echo "  Backend:  cd apps/backend && npm run start:dev"
    echo "  Frontend: cd apps/frontend && npm run dev"
    ;;
    
  3)
    echo -e "${BLUE}🛑 Stopping all containers...${NC}"
    docker-compose down 2>&1 | tee -a "$LOG_FILE"
    docker-compose -f docker-compose.dev.yml down 2>&1 | tee -a "$LOG_FILE"
    echo -e "${GREEN}✅ All containers stopped!${NC}"
    ;;
    
  4)
    echo "Which logs?"
    echo "a) All"
    echo "b) Backend"
    echo "c) Frontend"
    echo "d) Database"
    read -p "Enter choice: " log_choice
    
    case $log_choice in
      a) docker-compose logs -f ;;
      b) docker-compose logs -f backend ;;
      c) docker-compose logs -f frontend ;;
      d) docker-compose logs -f postgres ;;
      *) echo -e "${RED}Invalid choice${NC}" ;;
    esac
    ;;
    
  5)
    echo -e "${YELLOW}⚠️  This will delete all local database data!${NC}"
    read -p "Are you sure? (y/N): " confirm
    if [[ $confirm == "y" ]]; then
      echo -e "${BLUE}🗑️  Resetting database...${NC}"
      docker-compose down -v
      docker-compose -f docker-compose.dev.yml down -v
      echo -e "${GREEN}✅ Database reset complete!${NC}"
    else
      echo "Cancelled"
    fi
    ;;
    
  6)
    echo -e "${BLUE}🔄 Running Prisma migrations...${NC}"
    cd apps/backend
    
    # Check if database is running
    if ! docker ps | grep -q postgres; then
      echo -e "${YELLOW}Starting database first...${NC}"
      docker-compose -f ../../docker-compose.dev.yml up -d
      sleep 3
    fi
    
    export DATABASE_URL="postgresql://dbadmin:localpassword123@localhost:5432/usasset"
    npx prisma migrate dev
    echo -e "${GREEN}✅ Migrations complete!${NC}"
    ;;
    
  7)
    echo -e "${BLUE}🔌 Connecting to database...${NC}"
    docker exec -it usasset-postgres-dev psql -U dbadmin -d usasset || \
    docker exec -it usasset-postgres psql -U dbadmin -d usasset
    ;;
    
  *)
    echo -e "${RED}Invalid choice${NC}"
    exit 1
    ;;
esac
log_message "Script completed - Choice: $choice"
echo -e "
📄 Log saved to: $LOG_FILE"
