#!/bin/bash

# CI Debug Script - Sequential execution with resource monitoring
# This script runs CI commands sequentially to avoid resource contention

set -e
trap 'echo "Error on line $LINENO"' ERR

LOG_DIR=".logs"
DEBUG_LOG="$LOG_DIR/debug-ci-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log with timestamp
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEBUG_LOG"
}

# Function to check memory
check_memory() {
    local label="$1"
    local mem_info=$(free -h | grep "^Mem:")
    log "${YELLOW}Memory ($label):${NC} $mem_info"
}

# Function to run command with monitoring
run_with_monitor() {
    local cmd="$1"
    local timeout_sec="$2"
    local description="$3"
    
    log "${GREEN}Starting: $description${NC}"
    check_memory "before"
    
    local start_time=$(date +%s)
    
    # Run command with timeout
    if timeout "$timeout_sec" bash -c "$cmd" 2>&1 | tee -a "$DEBUG_LOG"; then
        local exit_code=0
        local status="${GREEN}SUCCESS${NC}"
    else
        local exit_code=$?
        if [ $exit_code -eq 124 ]; then
            local status="${RED}TIMEOUT${NC}"
        else
            local status="${RED}FAILED (exit $exit_code)${NC}"
        fi
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    check_memory "after"
    log "Status: $status | Duration: ${duration}s"
    echo ""
    
    return $exit_code
}

# Main execution
main() {
    mkdir -p "$LOG_DIR"
    
    log "${GREEN}=== CI Debug Script Started ===${NC}"
    log "Working directory: $(pwd)"
    log "Node version: $(node --version)"
    log "npm version: $(npm --version)"
    echo ""
    
    # Check initial state
    log "${BLUE}Initial system check:${NC}"
    check_memory "initial"
    log "Docker running: $(docker ps -q | wc -l) containers"
    log "Node processes: $(ps aux | grep node | wc -l)"
    echo ""
    
    # Clean logs
    log "${BLUE}Step 1: Clean logs${NC}"
    rm -rf $LOG_DIR/*.log 2>/dev/null || true
    touch "$DEBUG_LOG"
    echo ""
    
    # Run lint
    log "${BLUE}Step 2: Lint${NC}"
    if ! run_with_monitor "npm run lint" 60 "ESLint checking"; then
        log "${RED}Lint failed - continuing anyway${NC}"
    fi
    
    # Run typecheck
    log "${BLUE}Step 3: Typecheck${NC}"
    if ! run_with_monitor "npm run typecheck" 60 "TypeScript validation"; then
        log "${RED}Typecheck failed - continuing anyway${NC}"
    fi
    
    # Run tests SEQUENTIALLY per workspace to avoid memory issues
    log "${BLUE}Step 4: Tests (sequential by workspace)${NC}"
    
    log "Testing backend..."
    if ! run_with_monitor "npm run test --workspace=backend" 120 "Backend tests"; then
        log "${YELLOW}Backend tests failed${NC}"
    fi
    
    log "Testing frontend..."
    if ! run_with_monitor "npm run test --workspace=frontend" 60 "Frontend tests"; then
        log "${YELLOW}Frontend tests failed${NC}"
    fi
    
    log "Testing CLI..."
    if ! run_with_monitor "npm run test --workspace=cli" 60 "CLI tests"; then
        log "${YELLOW}CLI tests failed${NC}"
    fi
    
    # Run build SEQUENTIALLY to avoid memory issues
    log "${BLUE}Step 5: Build (sequential by workspace)${NC}"
    
    log "Building backend..."
    if ! run_with_monitor "npm run build --workspace=backend" 120 "Backend build"; then
        log "${RED}Backend build failed${NC}"
        exit 1
    fi
    
    log "Building frontend..."
    if ! run_with_monitor "npm run build --workspace=frontend" 120 "Frontend build"; then
        log "${RED}Frontend build failed${NC}"
        exit 1
    fi
    
    log "Building CLI..."
    if ! run_with_monitor "npm run build --workspace=cli" 60 "CLI build"; then
        log "${RED}CLI build failed${NC}"
        exit 1
    fi
    
    # Summary
    log "${BLUE}Step 6: Summary${NC}"
    if command -v npm run ci:summary &> /dev/null; then
        run_with_monitor "npm run ci:summary" 30 "CI summary"
    fi
    
    # Final report
    log "${GREEN}=== CI Debug Script Complete ===${NC}"
    log "Log file: $DEBUG_LOG"
    
    # Check for any error logs
    if ls $LOG_DIR/*error* 1> /dev/null 2>&1; then
        log "${YELLOW}Error logs found:${NC}"
        ls -la $LOG_DIR/*error* | tail -5
    fi
    
    # Final memory check
    check_memory "final"
}

# Run with error handling
if main; then
    echo -e "${GREEN}✓ CI Debug completed successfully${NC}"
    exit 0
else
    echo -e "${RED}✗ CI Debug failed${NC}"
    exit 1
fi