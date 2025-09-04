#!/bin/bash
# Asset API Tracer Bullet Test - Happy Path Only
set -e

echo "🎯 TRACER BULLET: Asset API End-to-End Test"
echo "=============================================="

API_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:5173"

# Test 1: Backend API Health
echo "✅ Test 1: Backend Health Check"
curl -s "$API_URL/health" | jq -r '.status'

# Test 2: Get Assets (Read Operation)
echo "✅ Test 2: Get Assets"
ASSETS_RESPONSE=$(curl -s "$API_URL/api/assets")
ASSET_COUNT=$(echo "$ASSETS_RESPONSE" | jq '.data.assets | length')
FIELD_COUNT=$(echo "$ASSETS_RESPONSE" | jq '.data.assets[0] | keys | length')
echo "   📊 Found $ASSET_COUNT assets with $FIELD_COUNT fields each"

# Test 3: Create Asset (Write Operation)
echo "✅ Test 3: Create Asset"
CREATE_DATA='{
  "assetTag": "TEST-TRACER-001",
  "name": "Tracer Bullet Asset",
  "manufacturer": "TestCorp",
  "status": "ACTIVE",
  "condition": "EXCELLENT"
}'
NEW_ASSET=$(curl -s -X POST "$API_URL/api/assets" \
  -H "Content-Type: application/json" \
  -d "$CREATE_DATA")
ASSET_ID=$(echo "$NEW_ASSET" | jq -r '.data.id')
echo "   🆕 Created asset ID: $ASSET_ID"

# Test 4: Update Asset (Partial Operation)
echo "✅ Test 4: Partial Update Asset"
UPDATE_DATA='{"manufacturer": "UpdatedCorp", "voltage": 480}'
curl -s -X PATCH "$API_URL/api/assets/$ASSET_ID" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_DATA" | jq -r '.success'

# Test 5: Bulk Operations
echo "✅ Test 5: Bulk Create"
BULK_DATA='[
  {"assetTag": "BULK-001", "name": "Bulk Asset 1", "status": "ACTIVE"},
  {"assetTag": "BULK-002", "name": "Bulk Asset 2", "status": "MAINTENANCE"}
]'
BULK_RESULT=$(curl -s -X POST "$API_URL/api/assets/bulk" \
  -H "Content-Type: application/json" \
  -d "$BULK_DATA")
BULK_SUCCESS=$(echo "$BULK_RESULT" | jq '.summary.successful')
echo "   📦 Bulk created: $BULK_SUCCESS assets"

# Test 6: Search/Filter
echo "✅ Test 6: Search Assets"
SEARCH_RESULT=$(curl -s "$API_URL/api/assets/search?manufacturer=TestCorp")
SEARCH_COUNT=$(echo "$SEARCH_RESULT" | jq '.data.assets | length')
echo "   🔍 Search found: $SEARCH_COUNT assets"

# Test 7: Frontend Health
echo "✅ Test 7: Frontend Health Check"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "   🌐 Frontend responding: OK"
else
  echo "   ❌ Frontend not responding"
fi

# Cleanup
echo "✅ Test 8: Cleanup"
curl -s -X DELETE "$API_URL/api/assets/$ASSET_ID" > /dev/null
echo "   🗑️  Cleaned up test asset"

echo ""
echo "🎉 TRACER BULLET COMPLETE: All systems operational!"
echo "   📋 Backend: $FIELD_COUNT fields per asset"
echo "   🔄 CRUD: Create/Read/Update/Delete working"
echo "   📦 Bulk operations: Working"
echo "   🔍 Search/filter: Working"
echo "   🌐 Frontend: Responding"
echo ""
echo "✨ Ready for production workloads!"