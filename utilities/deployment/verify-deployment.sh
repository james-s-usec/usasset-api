#!/bin/bash

# Post-Deployment Verification Script for USAsset
# Purpose: Verify Azure deployment health after running update-azure.sh
# Usage: ./verify-deployment.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URLs
BACKEND_URL="https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io"
FRONTEND_URL="https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io"

echo -e "${BLUE}🔍 USAsset Deployment Verification${NC}"
echo "===================================="

# Track failures
FAILURES=0

# 1. Check Backend Health
echo -e "\n${BLUE}1. Backend Health Check${NC}"
if curl -s -f "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is responding${NC}"
    HEALTH_JSON=$(curl -s "$BACKEND_URL/health")
    echo "   Status: $(echo "$HEALTH_JSON" | jq -r '.data.status')"
    echo "   Version: $(echo "$HEALTH_JSON" | jq -r '.data.version')"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    FAILURES=$((FAILURES + 1))
fi

# 2. Check Database Connection
echo -e "\n${BLUE}2. Database Connection${NC}"
if curl -s -f "$BACKEND_URL/health/db" > /dev/null 2>&1; then
    DB_JSON=$(curl -s "$BACKEND_URL/health/db")
    DB_STATUS=$(echo "$DB_JSON" | jq -r '.data.status')
    if [ "$DB_STATUS" = "connected" ]; then
        echo -e "${GREEN}✅ Database is connected${NC}"
    else
        echo -e "${RED}❌ Database status: $DB_STATUS${NC}"
        FAILURES=$((FAILURES + 1))
    fi
else
    echo -e "${RED}❌ Database health check failed${NC}"
    FAILURES=$((FAILURES + 1))
fi

# 3. Check Version Info
echo -e "\n${BLUE}3. Version Information${NC}"
if VERSION_JSON=$(curl -s "$BACKEND_URL/version" 2>/dev/null); then
    GIT_COMMIT=$(echo "$VERSION_JSON" | jq -r '.data.version // .data.gitCommit')
    BUILD_TIME=$(echo "$VERSION_JSON" | jq -r '.data.buildTime')
    echo "   Git Commit: $GIT_COMMIT"
    echo "   Build Time: $BUILD_TIME"
    
    # Check if deployed version matches current git HEAD
    LOCAL_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    if [ "$GIT_COMMIT" = "$LOCAL_COMMIT" ]; then
        echo -e "${GREEN}✅ Deployed version matches local HEAD${NC}"
    else
        echo -e "${YELLOW}⚠️  Deployed: $GIT_COMMIT, Local: $LOCAL_COMMIT${NC}"
    fi
fi

# 4. Check CORS Configuration
echo -e "\n${BLUE}4. CORS Configuration${NC}"
CORS_HEADER=$(curl -I -X OPTIONS \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: GET" \
    "$BACKEND_URL/health/db" 2>/dev/null | grep -i "access-control-allow-origin" || echo "")

if echo "$CORS_HEADER" | grep -q "$FRONTEND_URL"; then
    echo -e "${GREEN}✅ CORS properly configured for frontend${NC}"
else
    echo -e "${RED}❌ CORS not configured correctly${NC}"
    echo "   Expected: $FRONTEND_URL"
    echo "   Got: $CORS_HEADER"
    FAILURES=$((FAILURES + 1))
fi

# 5. Check Frontend Accessibility
echo -e "\n${BLUE}5. Frontend Accessibility${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Frontend is accessible (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Frontend returned HTTP $HTTP_CODE${NC}"
    FAILURES=$((FAILURES + 1))
fi

# 6. Check Container App Status
echo -e "\n${BLUE}6. Container App Revisions${NC}"
echo "Backend latest revision:"
BACKEND_REVISION=$(az containerapp revision list -n usasset-backend -g useng-usasset-api-rg \
    --query "[0].{Name:name, Active:properties.active, Traffic:properties.trafficWeight}" -o json 2>/dev/null)
if [ -n "$BACKEND_REVISION" ]; then
    echo "$BACKEND_REVISION" | jq '.'
fi

echo "Frontend latest revision:"
FRONTEND_REVISION=$(az containerapp revision list -n usasset-frontend -g useng-usasset-api-rg \
    --query "[0].{Name:name, Active:properties.active, Traffic:properties.trafficWeight}" -o json 2>/dev/null)
if [ -n "$FRONTEND_REVISION" ]; then
    echo "$FRONTEND_REVISION" | jq '.'
fi

# 7. Summary
echo -e "\n${BLUE}===================================${NC}"
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✅ All verification checks passed!${NC}"
    echo -e "\nBackend: $BACKEND_URL"
    echo -e "Frontend: $FRONTEND_URL"
    exit 0
else
    echo -e "${RED}❌ $FAILURES verification checks failed${NC}"
    echo -e "\n${YELLOW}Troubleshooting:${NC}"
    echo "1. Check container logs: az containerapp logs show -n usasset-backend -g useng-usasset-api-rg --tail 50"
    echo "2. Check Key Vault: az keyvault secret show --vault-name usasset-kv-yf2eqktewmxp2 --name database-connection-string"
    echo "3. Restart containers: ./update-azure.sh (select option 4)"
    exit 1
fi