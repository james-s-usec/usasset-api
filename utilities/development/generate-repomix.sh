#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Repomix Output Generator${NC}"
echo -e "${GREEN}========================================${NC}"
echo

# Check if repomix is available
if ! command -v repomix &> /dev/null && ! npx repomix --version &> /dev/null; then
    echo -e "${RED}Error: repomix is not installed or not available via npx${NC}"
    echo "Install it globally with: npm install -g repomix"
    exit 1
fi

# Function to generate repomix output
generate_repomix() {
    local app_name=$1
    local app_dir=$2
    
    echo -e "${YELLOW}Generating repomix output for ${app_name}...${NC}"
    
    if [ ! -d "$app_dir" ]; then
        echo -e "${RED}Error: Directory $app_dir does not exist${NC}"
        return 1
    fi
    
    cd "$app_dir" || exit 1
    
    if [ ! -f "repomix.config.json" ]; then
        echo -e "${RED}Error: repomix.config.json not found in $app_dir${NC}"
        return 1
    fi
    
    npx repomix
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Successfully generated repomix output for ${app_name}${NC}"
        echo
    else
        echo -e "${RED}✗ Failed to generate repomix output for ${app_name}${NC}"
        echo
        return 1
    fi
}

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Generate for backend
generate_repomix "Backend" "$SCRIPT_DIR/apps/backend"

# Generate for frontend  
generate_repomix "Frontend" "$SCRIPT_DIR/apps/frontend"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  All repomix outputs generated!${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo "Output files created:"
echo "  - apps/backend/repomix-backend-output.xml"
echo "  - apps/frontend/repomix-frontend-output.xml"