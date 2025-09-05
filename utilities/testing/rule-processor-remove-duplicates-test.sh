#!/bin/bash
# Remove Duplicates Processor Smoke Test - Happy Path
set -e

echo "🎯 REMOVE DUPLICATES PROCESSOR: Smoke Test"
echo "=========================================="

API_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Create Remove Duplicates Rule via API
echo -e "${BLUE}✅ Test 1: Create REMOVE_DUPLICATES Rule${NC}"
RESPONSE=$(curl -s -X POST "$API_URL/api/pipeline/rules" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Remove Duplicates - Clean Lists",
    "type": "REMOVE_DUPLICATES",
    "phase": "CLEAN",
    "target": "tags",
    "config": {
      "delimiter": ",",
      "caseSensitive": false
    },
    "is_active": true,
    "priority": 200
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
echo -e "${BLUE}✅ Test 2: Test Remove Duplicates Processing${NC}"
cd /home/swansonj/projects/USAsset3/apps/backend
npx ts-node -e "
import { RemoveDuplicatesProcessor } from './src/pipeline/processors/clean/remove-duplicates.processor';

async function testProcessor() {
  const processor = new RemoveDuplicatesProcessor();
  
  // Test cases
  const testCases = [
    { input: 'HVAC,Cooling,HVAC,Heating', expected: 'HVAC,Cooling,Heating' },
    { input: 'red,blue,RED,Blue,green', expected: 'red,blue,green' }, // Case insensitive
    { input: 'apple, apple, banana, apple', expected: 'apple,banana' }, // With spaces
    { input: 'single', expected: 'single' }, // No duplicates
    { input: 'A,a,B,b,C,c', expected: 'A,B,C' } // All case variants
  ];
  
  const config = {
    delimiter: ',',
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
    
    if (result.metadata && (result.metadata as any).duplicatesRemoved > 0) {
      console.log(\`         Duplicates removed: \${(result.metadata as any).duplicatesRemoved}\`);
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
import { RemoveDuplicatesProcessor } from './src/pipeline/processors/clean/remove-duplicates.processor';

async function testValidation() {
  const processor = new RemoveDuplicatesProcessor();
  
  // Valid config
  const validConfig = {
    delimiter: ',',
    caseSensitive: true
  };
  
  const validResult = await processor.validateConfig(validConfig);
  console.log(\`   ✅ Valid config: \${validResult.success ? 'PASSED' : 'FAILED'}\`);
  
  // Missing delimiter
  const missingDelimiter = {
    caseSensitive: false
  };
  
  const missingResult = await processor.validateConfig(missingDelimiter);
  console.log(\`   ✅ Missing delimiter rejected: \${!missingResult.success ? 'PASSED' : 'FAILED'}\`);
  if (missingResult.errors) {
    console.log(\`      Error: \${missingResult.errors[0]}\`);
  }
}

testValidation().catch(console.error);
"

# Test 4: Test Case Sensitivity
echo -e "${BLUE}✅ Test 4: Test Case Sensitivity${NC}"
npx ts-node -e "
import { RemoveDuplicatesProcessor } from './src/pipeline/processors/clean/remove-duplicates.processor';

async function testCaseSensitivity() {
  const processor = new RemoveDuplicatesProcessor();
  const context = {
    rowNumber: 1,
    jobId: 'test-job',
    correlationId: 'test-correlation',
    metadata: {}
  };
  
  // Case sensitive config
  const sensitiveConfig = {
    delimiter: ',',
    caseSensitive: true
  };
  
  const sensitiveResult = await processor.process('ABC,abc,ABC', sensitiveConfig, context);
  console.log(\`   Case Sensitive: 'ABC,abc,ABC' → '\${sensitiveResult.data}'\`);
  console.log(\`      \${sensitiveResult.data === 'ABC,abc' ? '✅ PASSED' : '❌ FAILED'}\`);
  
  // Case insensitive config
  const insensitiveConfig = {
    delimiter: ',',
    caseSensitive: false
  };
  
  const insensitiveResult = await processor.process('ABC,abc,ABC', insensitiveConfig, context);
  console.log(\`   Case Insensitive: 'ABC,abc,ABC' → '\${insensitiveResult.data}'\`);
  console.log(\`      \${insensitiveResult.data === 'ABC' ? '✅ PASSED' : '❌ FAILED'}\`);
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
echo -e "${GREEN}🎉 REMOVE DUPLICATES PROCESSOR TEST COMPLETE!${NC}"
echo "=========================================="