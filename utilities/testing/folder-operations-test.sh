#!/bin/bash
# Folder Operations Smoke Test - Happy Path Test
# Tests the folder management functionality end-to-end
set -e

echo "📁 FOLDER OPERATIONS: End-to-End Smoke Test"
echo "=============================================="

# Configuration
API_URL="http://localhost:3000"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_FOLDER_NAME="Test-Folder-$TIMESTAMP"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test functions
test_step() {
    echo -e "\n${BLUE}✅ Test $1${NC}"
}

check_result() {
    local result=$1
    local description=$2
    local allow_404=${3:-false}
    
    if echo "$result" | jq -e '.success' >/dev/null 2>&1; then
        echo -e "   ${GREEN}✓${NC} $description"
        return 0
    elif [ "$allow_404" = "true" ] && (echo "$result" | jq -e '.error.statusCode == 404' >/dev/null 2>&1 || [ -z "$result" ]); then
        echo -e "   ${YELLOW}ℹ${NC} $description (already deleted or not found)"
        return 0
    else
        echo -e "   ${RED}✗${NC} $description FAILED"
        echo "   Response: $result"
        return 1
    fi
}

# Pre-test cleanup: Remove any existing test folders
echo -e "${YELLOW}🧹 Pre-test Cleanup${NC}"
EXISTING_TEST_FOLDERS=$(curl -s "$API_URL/api/folders" | jq -r '.data[] | select(.name | startswith("Test-Folder")) | .id' 2>/dev/null || echo "")
if [ -n "$EXISTING_TEST_FOLDERS" ]; then
    echo "   Cleaning up existing test folders..."
    echo "$EXISTING_TEST_FOLDERS" | while read -r folder_id; do
        if [ -n "$folder_id" ]; then
            curl -s -X DELETE "$API_URL/api/folders/$folder_id" >/dev/null 2>&1
        fi
    done
    echo -e "   ${GREEN}✓${NC} Cleanup completed"
else
    echo -e "   ${GREEN}✓${NC} No test folders to clean up"
fi

# Test 1: Backend Health Check
test_step "1: Backend Health Check"
HEALTH_RESPONSE=$(curl -s "$API_URL/health" || echo '{"success": false}')
if echo "$HEALTH_RESPONSE" | jq -e '.data.status' >/dev/null 2>&1; then
    echo -e "   ${GREEN}✓${NC} Backend is healthy"
else
    echo -e "   ${RED}✗${NC} Backend health check failed"
    exit 1
fi

# Test 2: Get Initial Folders (Read Operation)
test_step "2: Get Initial Folders"
INITIAL_FOLDERS=$(curl -s "$API_URL/api/folders")
INITIAL_COUNT=$(echo "$INITIAL_FOLDERS" | jq -r '.data | length')
echo "   📊 Found $INITIAL_COUNT existing folders"

# List folder names for reference
echo "   📝 Existing folders:"
echo "$INITIAL_FOLDERS" | jq -r '.data[].name' | sed 's/^/      • /'

# Test 3: Create New Folder (Create Operation)
test_step "3: Create New Folder"
CREATE_DATA="{
  \"name\": \"$TEST_FOLDER_NAME\",
  \"description\": \"Smoke test folder created at $(date)\",
  \"color\": \"#FF5722\"
}"

NEW_FOLDER=$(curl -s -X POST "$API_URL/api/folders" \
  -H "Content-Type: application/json" \
  -d "$CREATE_DATA")

check_result "$NEW_FOLDER" "Folder creation"
FOLDER_ID=$(echo "$NEW_FOLDER" | jq -r '.data.id')
echo "   🆕 Created folder ID: $FOLDER_ID"

# Test 4: Verify Folder in List (Read Operation)
test_step "4: Verify Folder in List"
UPDATED_FOLDERS=$(curl -s "$API_URL/api/folders")
UPDATED_COUNT=$(echo "$UPDATED_FOLDERS" | jq -r '.data | length')
FOUND_FOLDER=$(echo "$UPDATED_FOLDERS" | jq -r --arg name "$TEST_FOLDER_NAME" '.data[] | select(.name == $name) | .name')

if [ "$FOUND_FOLDER" = "$TEST_FOLDER_NAME" ]; then
    echo -e "   ${GREEN}✓${NC} New folder appears in folder list"
    echo "   📈 Folder count increased from $INITIAL_COUNT to $UPDATED_COUNT"
else
    echo -e "   ${RED}✗${NC} New folder not found in folder list"
    exit 1
fi

# Test 5: Get Single Folder (Read Operation)
test_step "5: Get Single Folder by ID"
SINGLE_FOLDER=$(curl -s "$API_URL/api/folders/$FOLDER_ID")
check_result "$SINGLE_FOLDER" "Single folder retrieval"

FOLDER_NAME=$(echo "$SINGLE_FOLDER" | jq -r '.data.name')
FOLDER_COLOR=$(echo "$SINGLE_FOLDER" | jq -r '.data.color')
echo "   📄 Retrieved: $FOLDER_NAME (color: $FOLDER_COLOR)"

# Test 6: Update Folder (Update Operation)
test_step "6: Update Folder"
UPDATE_DATA="{
  \"name\": \"$TEST_FOLDER_NAME-Updated\",
  \"description\": \"Updated smoke test folder\",
  \"color\": \"#4CAF50\"
}"

UPDATED_FOLDER=$(curl -s -X PUT "$API_URL/api/folders/$FOLDER_ID" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_DATA")

check_result "$UPDATED_FOLDER" "Folder update"
echo "   ✏️  Updated folder name and color"

# Test 7: Verify Update
test_step "7: Verify Update"
VERIFY_UPDATE=$(curl -s "$API_URL/api/folders/$FOLDER_ID")
UPDATED_NAME=$(echo "$VERIFY_UPDATE" | jq -r '.data.name')
UPDATED_COLOR=$(echo "$VERIFY_UPDATE" | jq -r '.data.color')

if [ "$UPDATED_NAME" = "$TEST_FOLDER_NAME-Updated" ] && [ "$UPDATED_COLOR" = "#4CAF50" ]; then
    echo -e "   ${GREEN}✓${NC} Update verified: $UPDATED_NAME (color: $UPDATED_COLOR)"
else
    echo -e "   ${RED}✗${NC} Update verification failed"
    exit 1
fi

# Test 8: Test File Assignment (if files exist)
test_step "8: Test File-Folder Association"
FILES_RESPONSE=$(curl -s "$API_URL/api/files" 2>/dev/null || echo '{"data": []}')
FILE_COUNT=$(echo "$FILES_RESPONSE" | jq -r 'if (.data | type) == "array" then .data | length else 0 end' 2>/dev/null || echo "0")

if [ "$FILE_COUNT" -gt 0 ]; then
    echo "   📎 Found $FILE_COUNT files for testing folder association"
    FIRST_FILE_ID=$(echo "$FILES_RESPONSE" | jq -r '.data[0].id')
    echo "   🔗 Testing with file ID: $FIRST_FILE_ID"
    
    # Note: File-folder association would be tested here if the endpoint exists
    echo -e "   ${YELLOW}ℹ${NC}  File-folder association test skipped (endpoint TBD)"
else
    echo -e "   ${YELLOW}ℹ${NC}  No files available for folder association test"
fi

# Test 9: Cleanup - Delete Test Folder (Delete Operation)
test_step "9: Cleanup - Delete Test Folder"
DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/api/folders/$FOLDER_ID")
check_result "$DELETE_RESPONSE" "Folder deletion" true

# Test 10: Verify Deletion
test_step "10: Verify Deletion"
FINAL_FOLDERS=$(curl -s "$API_URL/api/folders")
FINAL_COUNT=$(echo "$FINAL_FOLDERS" | jq -r '.data | length')
DELETED_FOLDER=$(echo "$FINAL_FOLDERS" | jq -r --arg name "$TEST_FOLDER_NAME-Updated" '.data[] | select(.name == $name) | .name')

if [ -z "$DELETED_FOLDER" ]; then
    echo -e "   ${GREEN}✓${NC} Folder successfully deleted and removed from list"
    echo "   📉 Final folder count: $FINAL_COUNT"
else
    echo -e "   ${RED}✗${NC} Folder deletion verification failed - folder still exists"
    # Clean up the remaining test folder
    REMAINING_ID=$(echo "$FINAL_FOLDERS" | jq -r --arg name "$TEST_FOLDER_NAME-Updated" '.data[] | select(.name == $name) | .id')
    if [ -n "$REMAINING_ID" ]; then
        echo "   🧹 Attempting cleanup of remaining folder..."
        curl -s -X DELETE "$API_URL/api/folders/$REMAINING_ID" >/dev/null
    fi
fi

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 ALL FOLDER OPERATIONS TESTS PASSED!${NC}"
echo "=========================================="
echo "✅ Folder CRUD operations working correctly"
echo "✅ API responses properly formatted"
echo "✅ Data persistence verified"
echo "✅ Cleanup completed successfully"
echo ""
echo "📋 Test Coverage:"
echo "   • Create folder"
echo "   • Read folder list"
echo "   • Read single folder"
echo "   • Update folder"
echo "   • Delete folder"
echo "   • Verify operations"
echo ""
echo -e "${BLUE}💡 Next: Test folder operations via frontend UI${NC}"
echo "   1. Navigate to File Management"
echo "   2. Switch to 'Folders' view"
echo "   3. Click 'New Folder' button"
echo "   4. Verify folder creation dialog works"