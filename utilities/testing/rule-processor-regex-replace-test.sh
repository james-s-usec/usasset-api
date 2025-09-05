#!/bin/bash
# Regex Replace Processor Smoke Test - Happy Path
set -e

echo "🎯 REGEX REPLACE PROCESSOR: Smoke Test"
echo "======================================"

API_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Create Regex Replace Rule via API
echo -e "${BLUE}✅ Test 1: Create REGEX_REPLACE Rule${NC}"
RESPONSE=$(curl -s -X POST "$API_URL/api/pipeline/rules" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Regex Replace - Standardize Building Names",
    "type": "REGEX_REPLACE",
    "phase": "CLEAN",
    "target": "building",
    "config": {
      "pattern": "Bldg\\s+(\\d+)",
      "replacement": "Building $1",
      "flags": "gi"
    },
    "is_active": true,
    "priority": 100
  }')

RULE_ID=$(echo $RESPONSE | jq -r '.data.rule.id')
if [[ "$RULE_ID" != "null" ]]; then
  echo "   ✅ Created rule ID: $RULE_ID"
else
  echo -e "   ${RED}❌ Failed to create rule${NC}"
  echo "   Response: $RESPONSE"
  exit 1
fi

# Test 2: Test Processor with Sample Data
echo -e "${BLUE}✅ Test 2: Test Regex Replace Processing${NC}"
cd /home/swansonj/projects/USAsset3/apps/backend
npx ts-node -e "
import { RegexReplaceProcessor } from './src/pipeline/processors/clean/regex-replace.processor';

async function testProcessor() {
  const processor = new RegexReplaceProcessor();
  
  // Test cases
  const testCases = [
    { input: 'Bldg 1', expected: 'Building 1' },
    { input: 'bldg 42', expected: 'Building 42' },
    { input: 'BLDG 999', expected: 'Building 999' },
    { input: 'Building 5', expected: 'Building 5' }, // Already correct
    { input: 'Admin Office', expected: 'Admin Office' } // No match
  ];
  
  const config = {
    pattern: 'Bldg\\\\s+(\\\\d+)',
    replacement: 'Building \$1',
    flags: 'gi'
  };
  
  const context = {
    rowNumber: 1,
    jobId: 'test-job',
    correlationId: 'test-correlation',
    metadata: {}
  };
  
  console.log('   📊 TEST CASES:');
  let allPassed = true;
  
  for (const testCase of testCases) {
    const result = await processor.process(testCase.input, config, context);
    const passed = result.data === testCase.expected;
    allPassed = allPassed && passed;
    
    console.log(\`      \${passed ? '✅' : '❌'} '\${testCase.input}' → '\${result.data}' (expected: '\${testCase.expected}')\`);
    
    if (result.metadata && (result.metadata as any).matchCount > 0) {
      console.log(\`         Matches found: \${(result.metadata as any).matchCount}\`);
    }
  }
  
  if (allPassed) {
    console.log('   🎉 ALL TESTS PASSED!');
  } else {
    console.log('   ❌ SOME TESTS FAILED');
    process.exit(1);
  }
}

testProcessor().catch(console.error);
"

# Test 3: Test Config Validation
echo -e "${BLUE}✅ Test 3: Test Config Validation${NC}"
npx ts-node -e "
import { RegexReplaceProcessor } from './src/pipeline/processors/clean/regex-replace.processor';

async function testValidation() {
  const processor = new RegexReplaceProcessor();
  
  // Valid config
  const validConfig = {
    pattern: 'test',
    replacement: 'TEST',
    flags: 'g'
  };
  
  const validResult = await processor.validateConfig(validConfig);
  console.log(\`   ✅ Valid config: \${validResult.success ? 'PASSED' : 'FAILED'}\`);
  
  // Invalid regex pattern
  const invalidRegex = {
    pattern: '[invalid',
    replacement: 'TEST'
  };
  
  const invalidResult = await processor.validateConfig(invalidRegex);
  console.log(\`   ✅ Invalid regex rejected: \${!invalidResult.success ? 'PASSED' : 'FAILED'}\`);
  if (invalidResult.errors) {
    console.log(\`      Error: \${invalidResult.errors[0]}\`);
  }
  
  // Missing required fields
  const missingFields = {
    pattern: 'test'
    // missing replacement
  };
  
  const missingResult = await processor.validateConfig(missingFields);
  console.log(\`   ✅ Missing fields rejected: \${!missingResult.success ? 'PASSED' : 'FAILED'}\`);
}

testValidation().catch(console.error);
"

# Test 4: Cleanup
echo -e "${BLUE}✅ Test 4: Cleanup${NC}"
if [[ "$RULE_ID" != "null" ]]; then
  curl -s -X DELETE "$API_URL/api/pipeline/rules/$RULE_ID" > /dev/null
  echo "   🗑️  Deleted test rule"
fi

echo ""
echo -e "${GREEN}🎉 REGEX REPLACE PROCESSOR TEST COMPLETE!${NC}"
echo "======================================"