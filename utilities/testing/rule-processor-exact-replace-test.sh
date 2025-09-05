#!/bin/bash
# Exact Replace Processor Smoke Test - Happy Path
set -e

echo "🎯 EXACT REPLACE PROCESSOR: Smoke Test"
echo "======================================"

API_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Create Exact Replace Rule via API
echo -e "${BLUE}✅ Test 1: Create EXACT_REPLACE Rule${NC}"
RESPONSE=$(curl -s -X POST "$API_URL/api/pipeline/rules" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Exact Replace - Fix Common Terms",
    "type": "EXACT_REPLACE",
    "phase": "CLEAN",
    "target": "description",
    "config": {
      "replacements": [
        {"from": "AC", "to": "Air Conditioning"},
        {"from": "HVAC", "to": "Heating, Ventilation, and Air Conditioning"},
        {"from": "RTU", "to": "Rooftop Unit"}
      ],
      "caseSensitive": false
    },
    "is_active": true,
    "priority": 150
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
echo -e "${BLUE}✅ Test 2: Test Exact Replace Processing${NC}"
cd /home/swansonj/projects/USAsset3/apps/backend
npx ts-node -e "
import { ExactReplaceProcessor } from './src/pipeline/processors/clean/exact-replace.processor';

async function testProcessor() {
  const processor = new ExactReplaceProcessor();
  
  // Test cases
  const testCases = [
    { input: 'AC unit needs service', expected: 'Air Conditioning unit needs service' },
    { input: 'HVAC system installed', expected: 'Heating, Ventilation, and Air Conditioning system installed' },
    { input: 'RTU on roof', expected: 'Rooftop Unit on roof' },
    { input: 'ac and hvac units', expected: 'Air Conditioning and Heating, Ventilation, and Air Conditioning units' }, // Case insensitive
    { input: 'The AC HVAC RTU combo', expected: 'The Air Conditioning Heating, Ventilation, and Air Conditioning Rooftop Unit combo' } // Multiple replacements
  ];
  
  const config = {
    replacements: [
      {from: 'AC', to: 'Air Conditioning'},
      {from: 'HVAC', to: 'Heating, Ventilation, and Air Conditioning'},
      {from: 'RTU', to: 'Rooftop Unit'}
    ],
    caseSensitive: false
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
    
    console.log(\`      \${passed ? '✅' : '❌'} '\${testCase.input}'\`);
    console.log(\`         → '\${result.data}'\`);
    if (!passed) {
      console.log(\`         Expected: '\${testCase.expected}'\`);
    }
    
    if (result.metadata && (result.metadata as any).replacementCount > 0) {
      console.log(\`         Replacements made: \${(result.metadata as any).replacementCount}\`);
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
import { ExactReplaceProcessor } from './src/pipeline/processors/clean/exact-replace.processor';

async function testValidation() {
  const processor = new ExactReplaceProcessor();
  
  // Valid config
  const validConfig = {
    replacements: [
      {from: 'old', to: 'new'}
    ],
    caseSensitive: true
  };
  
  const validResult = await processor.validateConfig(validConfig);
  console.log(\`   ✅ Valid config: \${validResult.success ? 'PASSED' : 'FAILED'}\`);
  
  // Invalid - not an array
  const notArray = {
    replacements: 'not an array'
  };
  
  const notArrayResult = await processor.validateConfig(notArray);
  console.log(\`   ✅ Invalid array rejected: \${!notArrayResult.success ? 'PASSED' : 'FAILED'}\`);
  if (notArrayResult.errors) {
    console.log(\`      Error: \${notArrayResult.errors[0]}\`);
  }
  
  // Invalid - missing from/to
  const missingFields = {
    replacements: [
      {from: 'test'}
      // missing 'to'
    ]
  };
  
  const missingResult = await processor.validateConfig(missingFields);
  console.log(\`   ✅ Missing fields rejected: \${!missingResult.success ? 'PASSED' : 'FAILED'}\`);
}

testValidation().catch(console.error);
"

# Test 4: Test Case Sensitivity
echo -e "${BLUE}✅ Test 4: Test Case Sensitivity${NC}"
npx ts-node -e "
import { ExactReplaceProcessor } from './src/pipeline/processors/clean/exact-replace.processor';

async function testCaseSensitivity() {
  const processor = new ExactReplaceProcessor();
  const context = {
    rowNumber: 1,
    jobId: 'test-job',
    correlationId: 'test-correlation',
    metadata: {}
  };
  
  // Case sensitive config
  const sensitiveConfig = {
    replacements: [{from: 'AC', to: 'Air Conditioning'}],
    caseSensitive: true
  };
  
  const sensitiveResult = await processor.process('AC vs ac', sensitiveConfig, context);
  console.log(\`   Case Sensitive: 'AC vs ac' → '\${sensitiveResult.data}'\`);
  console.log(\`      \${sensitiveResult.data === 'Air Conditioning vs ac' ? '✅ PASSED' : '❌ FAILED'}\`);
  
  // Case insensitive config
  const insensitiveConfig = {
    replacements: [{from: 'AC', to: 'Air Conditioning'}],
    caseSensitive: false
  };
  
  const insensitiveResult = await processor.process('AC vs ac', insensitiveConfig, context);
  console.log(\`   Case Insensitive: 'AC vs ac' → '\${insensitiveResult.data}'\`);
  console.log(\`      \${insensitiveResult.data === 'Air Conditioning vs Air Conditioning' ? '✅ PASSED' : '❌ FAILED'}\`);
}

testCaseSensitivity().catch(console.error);
"

# Test 5: Cleanup
echo -e "${BLUE}✅ Test 5: Cleanup${NC}"
if [[ "$RULE_ID" != "null" ]]; then
  curl -s -X DELETE "$API_URL/api/pipeline/rules/$RULE_ID" > /dev/null
  echo "   🗑️  Deleted test rule"
fi

echo ""
echo -e "${GREEN}🎉 EXACT REPLACE PROCESSOR TEST COMPLETE!${NC}"
echo "======================================"