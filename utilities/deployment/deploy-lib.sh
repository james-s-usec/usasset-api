#!/bin/bash

# Deployment Library - Shared Functions for Azure Deployment
# Following Pragmatic Programmer principles:
# - DRY (Don't Repeat Yourself)
# - Orthogonality (Independent components)
# - Defensive Programming (Fail fast, fail loudly)
# - Good Enough Software (Simple, working, maintainable)

# -----------------------------------------------------------------------------
# Constants & Configuration
# -----------------------------------------------------------------------------
readonly SCRIPT_NAME=$(basename "${BASH_SOURCE[0]}")
readonly SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
readonly PROJECT_ROOT="$(dirname $(dirname $SCRIPT_DIR))"
readonly LOG_DIR="${PROJECT_ROOT}/.logs"

# Azure Configuration
readonly ACR_NAME="${ACR_NAME:-usassetacryf2eqktewmxp2}"
readonly RG_NAME="${RG_NAME:-useng-usasset-api-rg}"
readonly BACKEND_URL="${BACKEND_URL:-https://usasset-backend.purpledune-aecc1021.eastus.azurecontainerapps.io}"
readonly FRONTEND_URL="${FRONTEND_URL:-https://usasset-frontend.purpledune-aecc1021.eastus.azurecontainerapps.io}"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color

# -----------------------------------------------------------------------------
# Error Handling (Pragmatic Principle: Crash Early)
# -----------------------------------------------------------------------------
set -euo pipefail  # Exit on error, undefined variables, pipe failures
trap 'error_handler $? $LINENO' ERR

error_handler() {
    local exit_code=$1
    local line_number=$2
    echo -e "${RED}❌ Error occurred at line $line_number with exit code $exit_code${NC}" >&2
    echo "Check log file for details: $LOG_FILE" >&2
    cleanup_on_error
    exit $exit_code
}

cleanup_on_error() {
    # Cleanup operations on error
    echo "Performing cleanup..." >&2
    # Add any cleanup operations here
}

# -----------------------------------------------------------------------------
# Logging Functions (Pragmatic Principle: Design with Contracts)
# -----------------------------------------------------------------------------
setup_logging() {
    local log_prefix="${1:-deployment}"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    
    # Ensure log directory exists
    mkdir -p "$LOG_DIR"
    
    # Create log file
    LOG_FILE="${LOG_DIR}/${log_prefix}_${timestamp}.log"
    
    # Setup dual output (console + file)
    exec > >(tee -a "$LOG_FILE")
    exec 2>&1
    
    log_info "Starting $log_prefix - User: $(whoami) - Directory: $(pwd)"
    log_info "Log file: $LOG_FILE"
}

log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $*" | tee -a "${LOG_FILE:-/dev/null}"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $*${NC}" | tee -a "${LOG_FILE:-/dev/null}" >&2
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] $*${NC}" | tee -a "${LOG_FILE:-/dev/null}"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS] $*${NC}" | tee -a "${LOG_FILE:-/dev/null}"
}

# -----------------------------------------------------------------------------
# Validation Functions (Pragmatic Principle: Programming by Contract)
# -----------------------------------------------------------------------------
validate_prerequisites() {
    log_info "Validating prerequisites..."
    
    # Check required commands
    local required_commands=("az" "git" "jq" "curl" "docker")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Required command '$cmd' not found. Please install it first."
            return 1
        fi
    done
    
    # Check Azure CLI login
    if ! az account show &> /dev/null; then
        log_error "Not logged into Azure CLI. Run 'az login' first."
        return 1
    fi
    
    # Check git repository
    if ! git rev-parse --git-dir &> /dev/null; then
        log_error "Not in a git repository."
        return 1
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        log_warning "You have uncommitted changes. Consider committing before deployment."
        echo -n "Continue anyway? (y/N): "
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled by user."
            return 1
        fi
    fi
    
    log_success "All prerequisites validated"
    return 0
}

# -----------------------------------------------------------------------------
# Git Functions (Pragmatic Principle: Version Everything)
# -----------------------------------------------------------------------------
get_git_info() {
    GIT_COMMIT=$(git rev-parse --short HEAD)
    GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    GIT_DIRTY=$(git diff-index --quiet HEAD -- || echo "-dirty")
    BUILD_TIME=$(date +%Y-%m-%d_%H:%M:%S)
    
    log_info "Git info: branch=$GIT_BRANCH, commit=$GIT_COMMIT$GIT_DIRTY, time=$BUILD_TIME"
    
    export GIT_COMMIT GIT_BRANCH GIT_DIRTY BUILD_TIME
}

# -----------------------------------------------------------------------------
# Azure Functions (Pragmatic Principle: Orthogonality)
# -----------------------------------------------------------------------------
check_azure_resources() {
    log_info "Checking Azure resources..."
    
    # Check resource group exists
    if ! az group show --name "$RG_NAME" &> /dev/null; then
        log_error "Resource group '$RG_NAME' not found"
        return 1
    fi
    
    # Check ACR exists
    if ! az acr show --name "$ACR_NAME" --resource-group "$RG_NAME" &> /dev/null; then
        log_error "Container registry '$ACR_NAME' not found"
        return 1
    fi
    
    # Check container apps exist
    if ! az containerapp show --name usasset-backend --resource-group "$RG_NAME" &> /dev/null; then
        log_error "Backend container app not found"
        return 1
    fi
    
    if ! az containerapp show --name usasset-frontend --resource-group "$RG_NAME" &> /dev/null; then
        log_error "Frontend container app not found"
        return 1
    fi
    
    log_success "All Azure resources verified"
    return 0
}

build_and_push_image() {
    local app_name=$1
    local dockerfile=$2
    local build_args=${3:-""}
    
    log_info "Building $app_name image..."
    
    # Construct build command
    local build_cmd="az acr build --registry $ACR_NAME"
    build_cmd="$build_cmd --image $app_name:latest"
    build_cmd="$build_cmd --image $app_name:$GIT_COMMIT"
    build_cmd="$build_cmd --file $dockerfile"
    
    # Add build args if provided
    if [[ -n "$build_args" ]]; then
        build_cmd="$build_cmd $build_args"
    fi
    
    build_cmd="$build_cmd $PROJECT_ROOT"
    
    # Execute build with timeout
    if timeout 600 bash -c "$build_cmd" >> "$LOG_FILE" 2>&1; then
        log_success "$app_name image built successfully"
        return 0
    else
        log_error "Failed to build $app_name image"
        return 1
    fi
}

deploy_container_app() {
    local app_name=$1
    local image_tag=${2:-$GIT_COMMIT}
    local env_vars=${3:-""}
    
    log_info "Deploying $app_name with image tag $image_tag..."
    
    local deploy_cmd="az containerapp update"
    deploy_cmd="$deploy_cmd --name $app_name"
    deploy_cmd="$deploy_cmd --resource-group $RG_NAME"
    # Extract the service name from the app name (e.g., usasset-backend -> backend)
    local service_name="${app_name#*-}"
    deploy_cmd="$deploy_cmd --image $ACR_NAME.azurecr.io/$service_name:$image_tag"
    deploy_cmd="$deploy_cmd --revision-suffix deploy-$image_tag"
    
    # Add environment variables if provided
    if [[ -n "$env_vars" ]]; then
        deploy_cmd="$deploy_cmd --set-env-vars $env_vars"
    fi
    
    # Execute deployment with timeout
    if timeout 300 bash -c "$deploy_cmd" >> "$LOG_FILE" 2>&1; then
        log_success "$app_name deployed successfully"
        return 0
    else
        log_error "Failed to deploy $app_name"
        return 1
    fi
}

# -----------------------------------------------------------------------------
# Health Check Functions (Pragmatic Principle: Test Early, Test Often)
# -----------------------------------------------------------------------------
wait_for_health() {
    local url=$1
    local max_attempts=${2:-30}
    local delay=${3:-10}
    
    log_info "Waiting for $url to be healthy..."
    
    for attempt in $(seq 1 $max_attempts); do
        if curl -sf "$url" > /dev/null 2>&1; then
            log_success "$url is healthy"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts - waiting ${delay}s..."
        sleep $delay
    done
    
    log_error "$url failed to become healthy after $max_attempts attempts"
    return 1
}

# -----------------------------------------------------------------------------
# Summary Functions (Pragmatic Principle: Provide Options, Don't Make Excuses)
# -----------------------------------------------------------------------------
print_deployment_summary() {
    echo ""
    echo -e "${BLUE}=================================${NC}"
    echo -e "${GREEN}✨ Deployment Summary${NC}"
    echo -e "${BLUE}=================================${NC}"
    echo "Git Commit: $GIT_COMMIT$GIT_DIRTY"
    echo "Build Time: $BUILD_TIME"
    echo "Backend URL: $BACKEND_URL"
    echo "Frontend URL: $FRONTEND_URL"
    echo "Log File: $LOG_FILE"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Run verification: ./verify-deployment.sh"
    echo "2. Check container logs if issues: az containerapp logs show -n usasset-backend -g $RG_NAME --tail 50"
    echo "3. View deployment log: cat $LOG_FILE"
    echo -e "${BLUE}=================================${NC}"
}

# Export all functions for use in other scripts
export -f error_handler cleanup_on_error
export -f setup_logging log_info log_error log_warning log_success
export -f validate_prerequisites get_git_info check_azure_resources
export -f build_and_push_image deploy_container_app
export -f wait_for_health print_deployment_summary