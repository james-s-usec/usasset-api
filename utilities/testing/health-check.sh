#!/bin/bash

# USAsset E2E Health Check Script
# Tests frontend-backend communication and all critical endpoints

set -e

# Configuration
PROJECT_DIR="/home/swansonj/projects/USAsset3"
LOG_DIR="$PROJECT_DIR/.logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/health-check_$TIMESTAMP.log"
mkdir -p "$LOG_DIR"

# URLs - Local or Azure
if [ "$1" == "azure" ]; then
    BACKEND_URL="https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io"
    FRONTEND_URL="https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io"
    ENV="AZURE"
else
    BACKEND_URL="http://localhost:3000"
    FRONTEND_URL="http://localhost:5173"
    ENV="LOCAL"
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Test function with timeout
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    local method=${4:-GET}
    local data=${5:-}
    
    echo -ne "Testing $name... "
    log_message "Testing: $method $url"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method -H "Content-Type: application/json" -d "$data" "$url" --connect-timeout 5 --max-time 10 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$url" --connect-timeout 5 --max-time 10 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" == "$expected_status" ]; then
        echo -e "${GREEN}✅ OK${NC} (HTTP $http_code)"
        log_message "✅ PASS: $name returned $http_code"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected $expected_status, got $http_code)"
        log_message "❌ FAIL: $name returned $http_code, expected $expected_status"
        log_message "Response: $body"
        return 1
    fi
}

# Header
echo "=========================================="
echo -e "${BLUE}🔍 USAsset E2E Health Check - $ENV${NC}"
echo "=========================================="
echo "Backend:  $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo "Log:      $LOG_FILE"
echo "=========================================="
log_message "Starting health check for $ENV environment"

# Track failures
FAILED=0

# Test Backend Health
echo -e "\n${YELLOW}Backend API Tests:${NC}"
echo "----------------------------------------"

# Basic health
test_endpoint "Backend Root (Hello World)" "$BACKEND_URL/" 200 || ((FAILED++))
test_endpoint "Backend Health" "$BACKEND_URL/health" 200 || ((FAILED++))

# API endpoints
test_endpoint "Database Health" "$BACKEND_URL/api/health/db" 200 || ((FAILED++))

# Note: Add more endpoints as they are developed
# test_endpoint "Auth Check" "$BACKEND_URL/api/auth/check" 401 || ((FAILED++))
# test_endpoint "Users List" "$BACKEND_URL/api/users" 200 || ((FAILED++))

# Test a POST endpoint (example)
# test_endpoint "Login Test" "$BACKEND_URL/api/auth/login" 400 POST '{"email":"test@test.com","password":"test"}' || ((FAILED++))

# Test Frontend
echo -e "\n${YELLOW}Frontend Tests:${NC}"
echo "----------------------------------------"

# Frontend should be accessible
test_endpoint "Frontend Index" "$FRONTEND_URL/" 200 || ((FAILED++))

# Check if frontend has backend URL configured
echo -ne "Checking Frontend->Backend config... "
if curl -s "$FRONTEND_URL/" | grep -q "VITE_API_URL\|api\|backend" 2>/dev/null; then
    echo -e "${GREEN}✅ OK${NC}"
    log_message "✅ Frontend appears to have backend configuration"
else
    echo -e "${YELLOW}⚠️  Cannot verify${NC}"
    log_message "⚠️  Cannot verify frontend backend configuration"
fi

# Test CORS (Frontend calling Backend)
echo -e "\n${YELLOW}Cross-Origin Tests:${NC}"
echo "----------------------------------------"

echo -ne "Testing CORS headers... "
cors_headers=$(curl -s -I -X OPTIONS \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: GET" \
    "$BACKEND_URL/api/health" 2>&1 | grep -i "access-control")

if echo "$cors_headers" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✅ OK${NC}"
    log_message "✅ CORS headers present"
else
    echo -e "${RED}❌ FAIL${NC} (No CORS headers)"
    log_message "❌ CORS headers missing"
    ((FAILED++))
fi

# Database connectivity test (if endpoint exists)
echo -e "\n${YELLOW}Database Tests:${NC}"
echo "----------------------------------------"

echo -ne "Testing database query... "
db_test=$(curl -s "$BACKEND_URL/api/health/db" 2>&1)
if echo "$db_test" | grep -q "ok\|connected\|true"; then
    echo -e "${GREEN}✅ OK${NC}"
    log_message "✅ Database connection successful"
else
    echo -e "${YELLOW}⚠️  Cannot verify${NC}"
    log_message "⚠️  Cannot verify database connection"
fi

# Performance check
echo -e "\n${YELLOW}Performance Tests:${NC}"
echo "----------------------------------------"

echo -ne "Backend response time... "
response_time=$(curl -o /dev/null -s -w "%{time_total}" "$BACKEND_URL/health")
response_ms=$(echo "$response_time * 1000" | bc -l | cut -d. -f1)

if [ "$response_ms" -lt 1000 ]; then
    echo -e "${GREEN}✅ Fast${NC} (${response_ms}ms)"
    log_message "✅ Backend response time: ${response_ms}ms"
elif [ "$response_ms" -lt 3000 ]; then
    echo -e "${YELLOW}⚠️  Slow${NC} (${response_ms}ms)"
    log_message "⚠️  Backend response time slow: ${response_ms}ms"
else
    echo -e "${RED}❌ Very slow${NC} (${response_ms}ms)"
    log_message "❌ Backend response time very slow: ${response_ms}ms"
    ((FAILED++))
fi

# Summary
echo "=========================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    log_message "✅ All tests passed successfully"
else
    echo -e "${RED}❌ $FAILED tests failed${NC}"
    log_message "❌ $FAILED tests failed"
fi
echo "=========================================="

# Optional: Test specific API endpoints
if [ "$2" == "full" ]; then
    echo -e "\n${YELLOW}Full API Test Suite:${NC}"
    echo "----------------------------------------"
    
    # Add your specific API endpoints here
    # test_endpoint "Users List" "$BACKEND_URL/api/users" 200
    # test_endpoint "Products List" "$BACKEND_URL/api/products" 200
    # test_endpoint "Create User" "$BACKEND_URL/api/users" 201 POST '{"name":"Test User","email":"test@example.com"}'
fi

echo ""
echo "📄 Full log: $LOG_FILE"
echo "View log: cat $LOG_FILE"

exit $FAILED