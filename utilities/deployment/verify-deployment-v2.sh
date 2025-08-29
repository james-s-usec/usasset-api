#!/bin/bash

# Post-Deployment Verification Script v2
# Hardened with Pragmatic Programmer principles:
# - Comprehensive health checks with detailed reporting
# - Defensive programming with timeout handling
# - Clear contract: returns 0 if all healthy, 1 if any issues

# Load shared deployment library
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "${SCRIPT_DIR}/deploy-lib.sh"

# -----------------------------------------------------------------------------
# Verification Functions
# -----------------------------------------------------------------------------
check_backend_health() {
    log_info "Checking backend health..."
    
    local health_endpoint="${BACKEND_URL}/health"
    local response=$(curl -sf "$health_endpoint" 2>/dev/null || echo "{}")
    
    if [ -z "$response" ] || [ "$response" = "{}" ]; then
        log_error "Backend health check failed - no response"
        return 1
    fi
    
    local status=$(echo "$response" | jq -r '.data.status // "unknown"')
    local version=$(echo "$response" | jq -r '.data.version // "unknown"')
    
    if [ "$status" = "ok" ]; then
        log_success "Backend is healthy - Status: $status, Version: $version"
        return 0
    else
        log_error "Backend unhealthy - Status: $status"
        return 1
    fi
}

check_database_connection() {
    log_info "Checking database connection..."
    
    local db_endpoint="${BACKEND_URL}/health/db"
    local response=$(curl -sf "$db_endpoint" 2>/dev/null || echo "{}")
    
    if [ -z "$response" ] || [ "$response" = "{}" ]; then
        log_error "Database health check failed - no response"
        return 1
    fi
    
    local db_status=$(echo "$response" | jq -r '.data.status // "unknown"')
    
    if [ "$db_status" = "connected" ]; then
        log_success "Database is connected"
        return 0
    else
        log_error "Database connection failed - Status: $db_status"
        return 1
    fi
}

check_version_match() {
    log_info "Checking version information..."
    
    local version_endpoint="${BACKEND_URL}/version"
    local response=$(curl -sf "$version_endpoint" 2>/dev/null || echo "{}")
    
    if [ -z "$response" ] || [ "$response" = "{}" ]; then
        log_warning "Version endpoint not responding"
        return 0  # Non-critical, don't fail verification
    fi
    
    local deployed_commit=$(echo "$response" | jq -r '.data.version // .data.gitCommit // "unknown"')
    local build_time=$(echo "$response" | jq -r '.data.buildTime // "unknown"')
    local local_commit=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    
    log_info "Deployed version: $deployed_commit (built: $build_time)"
    log_info "Local version: $local_commit"
    
    if [ "$deployed_commit" = "$local_commit" ]; then
        log_success "Version match confirmed"
    else
        log_warning "Version mismatch - Deployed: $deployed_commit, Local: $local_commit"
    fi
    
    return 0
}

check_cors_configuration() {
    log_info "Checking CORS configuration..."
    
    local cors_response=$(curl -I -X OPTIONS \
        -H "Origin: $FRONTEND_URL" \
        -H "Access-Control-Request-Method: GET" \
        "${BACKEND_URL}/health/db" 2>/dev/null)
    
    local cors_header=$(echo "$cors_response" | grep -i "access-control-allow-origin" || echo "")
    
    if echo "$cors_header" | grep -q "$FRONTEND_URL"; then
        log_success "CORS properly configured for frontend"
        return 0
    else
        log_error "CORS not configured correctly"
        log_info "Expected: $FRONTEND_URL"
        log_info "Got: $cors_header"
        return 1
    fi
}

check_frontend_accessibility() {
    log_info "Checking frontend accessibility..."
    
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null)
    
    if [ "$http_code" = "200" ]; then
        log_success "Frontend is accessible (HTTP $http_code)"
        return 0
    else
        log_error "Frontend returned HTTP $http_code"
        return 1
    fi
}

check_container_revisions() {
    log_info "Checking container app revisions..."
    
    # Check backend revision
    local backend_revision=$(az containerapp revision list \
        -n usasset-backend \
        -g "$RG_NAME" \
        --query "[0].{Name:name, Active:properties.active, Traffic:properties.trafficWeight}" \
        -o json 2>/dev/null)
    
    if [ -n "$backend_revision" ] && [ "$backend_revision" != "[]" ]; then
        local backend_name=$(echo "$backend_revision" | jq -r '.Name // "unknown"')
        local backend_active=$(echo "$backend_revision" | jq -r '.Active // false')
        local backend_traffic=$(echo "$backend_revision" | jq -r '.Traffic // 0')
        
        if [ "$backend_active" = "true" ] && [ "$backend_traffic" -gt 0 ]; then
            log_success "Backend revision active: $backend_name (Traffic: ${backend_traffic}%)"
        else
            log_warning "Backend revision issues - Active: $backend_active, Traffic: ${backend_traffic}%"
        fi
    else
        log_error "Failed to get backend revision information"
        return 1
    fi
    
    # Check frontend revision
    local frontend_revision=$(az containerapp revision list \
        -n usasset-frontend \
        -g "$RG_NAME" \
        --query "[0].{Name:name, Active:properties.active, Traffic:properties.trafficWeight}" \
        -o json 2>/dev/null)
    
    if [ -n "$frontend_revision" ] && [ "$frontend_revision" != "[]" ]; then
        local frontend_name=$(echo "$frontend_revision" | jq -r '.Name // "unknown"')
        local frontend_active=$(echo "$frontend_revision" | jq -r '.Active // false')
        local frontend_traffic=$(echo "$frontend_revision" | jq -r '.Traffic // 0')
        
        if [ "$frontend_active" = "true" ] && [ "$frontend_traffic" -gt 0 ]; then
            log_success "Frontend revision active: $frontend_name (Traffic: ${frontend_traffic}%)"
        else
            log_warning "Frontend revision issues - Active: $frontend_active, Traffic: ${frontend_traffic}%"
        fi
    else
        log_error "Failed to get frontend revision information"
        return 1
    fi
    
    return 0
}

correlate_deployment_logs() {
    log_info "Correlating with deployment logs..."
    
    local recent_deploy_log=$(ls -t "$LOG_DIR"/azure-deployment_*.log 2>/dev/null | head -1)
    
    if [ -n "$recent_deploy_log" ]; then
        local deploy_time=$(basename "$recent_deploy_log" | sed 's/azure-deployment_//' | sed 's/.log//')
        log_info "Found deployment log from: $deploy_time"
        
        # Check if deployment was successful
        if grep -q "Deployment completed successfully" "$recent_deploy_log"; then
            log_success "Previous deployment completed successfully"
        else
            log_warning "Previous deployment may have had issues - check: $recent_deploy_log"
        fi
    else
        log_info "No recent deployment logs found"
    fi
    
    return 0
}

# -----------------------------------------------------------------------------
# Performance Checks
# -----------------------------------------------------------------------------
check_response_times() {
    log_info "Checking response times..."
    
    # Backend response time
    local backend_time=$(curl -o /dev/null -s -w "%{time_total}" "${BACKEND_URL}/health" 2>/dev/null)
    if (( $(echo "$backend_time < 2" | bc -l) )); then
        log_success "Backend response time: ${backend_time}s (good)"
    else
        log_warning "Backend response time: ${backend_time}s (slow)"
    fi
    
    # Frontend response time
    local frontend_time=$(curl -o /dev/null -s -w "%{time_total}" "$FRONTEND_URL" 2>/dev/null)
    if (( $(echo "$frontend_time < 3" | bc -l) )); then
        log_success "Frontend response time: ${frontend_time}s (good)"
    else
        log_warning "Frontend response time: ${frontend_time}s (slow)"
    fi
    
    return 0
}

# -----------------------------------------------------------------------------
# Main Verification
# -----------------------------------------------------------------------------
main() {
    # Setup logging
    setup_logging "verify-deployment"
    
    echo -e "${BLUE}🔍 USAsset Deployment Verification v2${NC}"
    echo "======================================"
    
    # Track failures
    local failures=0
    local warnings=0
    
    # Run all checks
    local checks=(
        "check_backend_health"
        "check_database_connection"
        "check_version_match"
        "check_cors_configuration"
        "check_frontend_accessibility"
        "check_container_revisions"
        "correlate_deployment_logs"
        "check_response_times"
    )
    
    for check in "${checks[@]}"; do
        echo ""
        if ! $check; then
            ((failures++))
        fi
    done
    
    # Summary
    echo ""
    echo -e "${BLUE}===================================${NC}"
    
    if [ $failures -eq 0 ]; then
        log_success "All verification checks passed!"
        echo -e "${GREEN}✅ Deployment verified successfully${NC}"
        echo ""
        echo "Backend: $BACKEND_URL"
        echo "Frontend: $FRONTEND_URL"
        echo "Log: $LOG_FILE"
        exit 0
    else
        log_error "$failures verification checks failed"
        echo -e "${RED}❌ Deployment verification failed${NC}"
        echo ""
        echo -e "${YELLOW}Troubleshooting:${NC}"
        echo "1. Check detailed log: cat $LOG_FILE"
        echo "2. View container logs: az containerapp logs show -n usasset-backend -g $RG_NAME --tail 50"
        echo "3. Check Key Vault: az keyvault secret show --vault-name usasset-kv-yf2eqktewmxp2 --name database-connection-string"
        echo "4. Restart containers: ./update-azure-v2.sh (option 4)"
        exit 1
    fi
}

# Run main function
main "$@"