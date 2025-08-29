#!/bin/bash

# USAsset Azure Deployment Script v2
# Hardened with Pragmatic Programmer principles:
# - Fail fast with clear error messages
# - Defensive programming with validation
# - DRY principle using shared library
# - Orthogonal design with independent components

# Load shared deployment library
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "${SCRIPT_DIR}/deploy-lib.sh"

# -----------------------------------------------------------------------------
# Main Deployment Functions
# -----------------------------------------------------------------------------
deploy_backend() {
    log_info "Starting backend deployment..."
    
    # Get git information
    get_git_info
    
    # Build backend image
    local build_args="--build-arg GIT_COMMIT=$GIT_COMMIT"
    build_args="$build_args --build-arg BUILD_TIME=$BUILD_TIME"
    build_args="$build_args --build-arg VERSION=$BUILD_TIME"
    
    if ! build_and_push_image "backend" \
        "${PROJECT_ROOT}/apps/backend/Dockerfile.production" \
        "$build_args"; then
        log_error "Backend build failed"
        return 1
    fi
    
    # Deploy backend container
    local env_vars="APP_VERSION=$GIT_COMMIT"
    env_vars="$env_vars BUILD_TIME=\"$BUILD_TIME\""
    env_vars="$env_vars CORS_ORIGIN=$FRONTEND_URL"
    
    if ! deploy_container_app "usasset-backend" "$GIT_COMMIT" "$env_vars"; then
        log_error "Backend deployment failed"
        return 1
    fi
    
    # Wait for backend to be healthy
    if ! wait_for_health "${BACKEND_URL}/health" 30 10; then
        log_error "Backend health check failed"
        return 1
    fi
    
    log_success "Backend deployment completed successfully"
    return 0
}

deploy_frontend() {
    log_info "Starting frontend deployment..."
    
    # Get git information
    get_git_info
    
    # Build frontend image with API URL
    local build_args="--build-arg VITE_API_URL=$BACKEND_URL"
    
    if ! build_and_push_image "frontend" \
        "${PROJECT_ROOT}/apps/frontend/Dockerfile" \
        "$build_args"; then
        log_error "Frontend build failed"
        return 1
    fi
    
    # Deploy frontend container
    if ! deploy_container_app "usasset-frontend" "$GIT_COMMIT"; then
        log_error "Frontend deployment failed"
        return 1
    fi
    
    # Wait for frontend to be accessible
    if ! wait_for_health "$FRONTEND_URL" 30 10; then
        log_error "Frontend health check failed"
        return 1
    fi
    
    log_success "Frontend deployment completed successfully"
    return 0
}

deploy_both() {
    log_info "Starting full stack deployment..."
    
    # Deploy backend first
    if ! deploy_backend; then
        log_error "Backend deployment failed, aborting frontend deployment"
        return 1
    fi
    
    # Deploy frontend
    if ! deploy_frontend; then
        log_error "Frontend deployment failed"
        return 1
    fi
    
    log_success "Full stack deployment completed successfully"
    return 0
}

restart_containers() {
    log_info "Restarting containers without rebuild..."
    
    # Get latest revisions
    local backend_revision=$(az containerapp revision list \
        --name usasset-backend \
        --resource-group "$RG_NAME" \
        --query '[0].name' -o tsv)
    
    local frontend_revision=$(az containerapp revision list \
        --name usasset-frontend \
        --resource-group "$RG_NAME" \
        --query '[0].name' -o tsv)
    
    # Restart backend
    log_info "Restarting backend revision: $backend_revision"
    if ! az containerapp revision restart \
        --name usasset-backend \
        --resource-group "$RG_NAME" \
        --revision "$backend_revision" >> "$LOG_FILE" 2>&1; then
        log_error "Failed to restart backend"
        return 1
    fi
    
    # Restart frontend
    log_info "Restarting frontend revision: $frontend_revision"
    if ! az containerapp revision restart \
        --name usasset-frontend \
        --resource-group "$RG_NAME" \
        --revision "$frontend_revision" >> "$LOG_FILE" 2>&1; then
        log_error "Failed to restart frontend"
        return 1
    fi
    
    log_success "Containers restarted successfully"
    return 0
}

# -----------------------------------------------------------------------------
# Interactive Menu
# -----------------------------------------------------------------------------
show_menu() {
    echo -e "${BLUE}🚀 USAsset Azure Deployment v2${NC}"
    echo "================================="
    echo "Deployment Options:"
    echo "  1) Backend only"
    echo "  2) Frontend only"
    echo "  3) Both applications (recommended)"
    echo "  4) Restart containers (no rebuild)"
    echo "  5) Validate environment only"
    echo "  0) Exit"
    echo "--------------------------------"
}

# -----------------------------------------------------------------------------
# Main Script
# -----------------------------------------------------------------------------
main() {
    # Setup logging
    setup_logging "azure-deployment"
    
    # Validate prerequisites
    if ! validate_prerequisites; then
        log_error "Prerequisites validation failed"
        exit 1
    fi
    
    # Check Azure resources
    if ! check_azure_resources; then
        log_error "Azure resource validation failed"
        exit 1
    fi
    
    # Show menu and get choice
    show_menu
    read -p "Enter choice (0-5): " choice
    
    # Process choice
    case $choice in
        1)
            log_info "User selected: Backend deployment"
            deploy_backend
            ;;
        2)
            log_info "User selected: Frontend deployment"
            deploy_frontend
            ;;
        3)
            log_info "User selected: Full stack deployment"
            deploy_both
            ;;
        4)
            log_info "User selected: Container restart"
            restart_containers
            ;;
        5)
            log_info "User selected: Environment validation only"
            get_git_info  # Still need git info for summary
            log_success "Environment validation completed"
            ;;
        0)
            log_info "User selected: Exit"
            echo "Deployment cancelled"
            exit 0
            ;;
        *)
            log_error "Invalid choice: $choice"
            echo -e "${RED}Invalid choice. Please run the script again.${NC}"
            exit 1
            ;;
    esac
    
    # Check deployment result
    if [ $? -eq 0 ]; then
        print_deployment_summary
        log_success "Deployment completed successfully"
        
        # Prompt for verification
        echo ""
        echo -n "Run verification now? (Y/n): "
        read -r response
        if [[ ! "$response" =~ ^[Nn]$ ]]; then
            log_info "Running verification script..."
            "${SCRIPT_DIR}/verify-deployment.sh"
        fi
    else
        log_error "Deployment failed - check log for details"
        echo -e "${RED}❌ Deployment failed${NC}"
        echo "Log file: $LOG_FILE"
        exit 1
    fi
}

# Run main function
main "$@"