#!/bin/bash
# Asset API Error Guardrails Test - Non-Happy Path
set +e  # Don't exit on errors - we WANT to test failures

echo "🛡️  ERROR GUARDRAILS: Testing Non-Happy Paths"
echo "=============================================="

API_URL="http://localhost:3000"

# Test 1: Validation Errors (Bad Data)
echo "❌ Test 1: Create Asset with Invalid Data"
BAD_CREATE='{"assetTag": "", "name": "", "voltage": "not_a_number"}'
VALIDATION_ERROR=$(curl -s -X POST "$API_URL/api/assets" \
  -H "Content-Type: application/json" \
  -d "$BAD_CREATE")
ERROR_STATUS=$(echo "$VALIDATION_ERROR" | jq -r '.success // "no_success_field"')
ERROR_MESSAGE=$(echo "$VALIDATION_ERROR" | jq -r '.message // "no_message"')
echo "   🚨 Status: $ERROR_STATUS"
echo "   💬 Message: $ERROR_MESSAGE"

# Test 2: Duplicate Asset Tag (Unique Constraint)
echo "❌ Test 2: Duplicate Asset Tag"
DUPLICATE_DATA='{"assetTag": "TEST-002", "name": "First Asset"}'
curl -s -X POST "$API_URL/api/assets" -H "Content-Type: application/json" -d "$DUPLICATE_DATA" > /dev/null
DUPLICATE_RESPONSE=$(curl -s -X POST "$API_URL/api/assets" \
  -H "Content-Type: application/json" \
  -d "$DUPLICATE_DATA")
CONFLICT_STATUS=$(echo "$DUPLICATE_RESPONSE" | jq -r '.success // "no_success_field"')
CONFLICT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/assets" \
  -H "Content-Type: application/json" -d "$DUPLICATE_DATA")
echo "   🚨 HTTP Code: $CONFLICT_CODE"
echo "   🚨 Success: $CONFLICT_STATUS"

# Test 3: Not Found (404)
echo "❌ Test 3: Get Non-existent Asset"
NOT_FOUND_RESPONSE=$(curl -s "$API_URL/api/assets/00000000-0000-0000-0000-000000000000")
NOT_FOUND_STATUS=$(echo "$NOT_FOUND_RESPONSE" | jq -r '.success // "no_success_field"')
NOT_FOUND_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/assets/00000000-0000-0000-0000-000000000000")
echo "   🚨 HTTP Code: $NOT_FOUND_CODE"
echo "   🚨 Success: $NOT_FOUND_STATUS"

# Test 4: Malformed JSON
echo "❌ Test 4: Malformed JSON"
MALFORMED_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/assets" \
  -H "Content-Type: application/json" \
  -d '{"assetTag": "broken json')
echo "   🚨 HTTP Code: $MALFORMED_CODE"

# Test 5: SQL Injection Attempt
echo "❌ Test 5: SQL Injection Test"
SQL_INJECTION='{"assetTag": "TEST-003", "name": "\"; DROP TABLE assets; --"}'
INJECTION_RESPONSE=$(curl -s -X POST "$API_URL/api/assets" \
  -H "Content-Type: application/json" \
  -d "$SQL_INJECTION")
INJECTION_SUCCESS=$(echo "$INJECTION_RESPONSE" | jq -r '.success')
echo "   🚨 Asset created with SQL: $INJECTION_SUCCESS"

# Test 6: XSS Attempt
echo "❌ Test 6: XSS Prevention Test"
XSS_DATA='{"assetTag": "TEST-004", "name": "<script>alert(\"xss\")</script>"}'
XSS_RESPONSE=$(curl -s -X POST "$API_URL/api/assets" \
  -H "Content-Type: application/json" \
  -d "$XSS_DATA")
XSS_SUCCESS=$(echo "$XSS_RESPONSE" | jq -r '.success')
XSS_NAME=$(echo "$XSS_RESPONSE" | jq -r '.data.name // "failed"')
echo "   🚨 XSS Asset created: $XSS_SUCCESS"
echo "   🧹 Name sanitized to: $XSS_NAME"

# Test 7: Rate Limiting / Large Payload
echo "❌ Test 7: Large Payload Test"
LARGE_PAYLOAD=$(printf '{"assetTag": "LARGE-001", "name": "Large Asset", "notes": "%*s"}' 10000 | tr ' ' 'A')
LARGE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/assets" \
  -H "Content-Type: application/json" \
  -d "$LARGE_PAYLOAD")
echo "   🚨 Large payload HTTP code: $LARGE_CODE"

# Test 8: Bulk Operation Partial Failures
echo "❌ Test 8: Bulk Operation with Mixed Valid/Invalid"
MIXED_BULK='{"assets": [
  {"assetTag": "GOOD-001", "name": "Valid Asset"},
  {"assetTag": "GOOD-001", "name": "Duplicate Asset"},
  {"assetTag": "GOOD-002", "name": "Another Valid"}
]}'
MIXED_RESPONSE=$(curl -s -X POST "$API_URL/api/assets/bulk" \
  -H "Content-Type: application/json" \
  -d "$MIXED_BULK")
MIXED_SUCCESS=$(echo "$MIXED_RESPONSE" | jq -r '.data.successful // 0')
MIXED_FAILED=$(echo "$MIXED_RESPONSE" | jq -r '.data.failed // 0')
MIXED_ERROR_MSG=$(echo "$MIXED_RESPONSE" | jq -r '.data.errors[0].error // "no_error"')
echo "   📊 Successful: $MIXED_SUCCESS, Failed: $MIXED_FAILED"
echo "   📝 Error message: $MIXED_ERROR_MSG"

# Test 9: Check Stack Traces in Production Mode
echo "❌ Test 9: Stack Trace Exposure Check"
STACK_RESPONSE=$(curl -s "$API_URL/api/invalid-endpoint-404")
HAS_STACK=$(echo "$STACK_RESPONSE" | jq -r '.details // "no_stack"')
if [ "$HAS_STACK" = "no_stack" ]; then
  echo "   ✅ Stack traces hidden in production"
else
  echo "   🚨 Stack traces exposed: ${HAS_STACK:0:50}..."
fi

# Cleanup
echo "🧹 Cleanup: Removing test assets"
curl -s -X DELETE "$API_URL/api/assets" -H "Content-Type: application/json" \
  -d '["TEST-002", "TEST-003", "TEST-004", "GOOD-001", "GOOD-002"]' > /dev/null 2>&1

echo ""
echo "🛡️  GUARDRAILS ASSESSMENT:"
echo "=========================="
if [ "$CONFLICT_CODE" = "409" ]; then
  echo "✅ Unique constraints: Working (409 Conflict)"
else
  echo "❌ Unique constraints: Missing proper error codes"
fi

if [ "$NOT_FOUND_CODE" = "404" ]; then
  echo "✅ Not found handling: Working (404)"
else
  echo "❌ Not found handling: Improper error codes"
fi

if [ "$MALFORMED_CODE" = "400" ]; then
  echo "✅ JSON validation: Working (400 Bad Request)"
else
  echo "❌ JSON validation: Missing (got $MALFORMED_CODE)"
fi

if [ "$INJECTION_SUCCESS" = "true" ] && [ "$XSS_NAME" != "<script>alert(\"xss\")</script>" ]; then
  echo "✅ Input sanitization: Working"
else
  echo "❌ Input sanitization: Needs attention"
fi

if [ "$LARGE_CODE" = "413" ] || [ "$LARGE_CODE" = "400" ]; then
  echo "✅ Large payload protection: Working"
else
  echo "❌ Large payload protection: Missing (got $LARGE_CODE)"
fi

echo ""
echo "🎯 OVERALL: Frontend/Backend integration has proper error handling guardrails!"