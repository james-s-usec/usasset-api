#!/bin/bash
# Rules Pipeline Integration Test - End to End
set -e

echo "🎯 RULES PIPELINE INTEGRATION: End-to-End Test"
echo "=============================================="

API_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Create Multiple Rules
echo -e "${BLUE}✅ Test 1: Create Rules for Integration Test${NC}"

# Create TRIM rule
TRIM_RESPONSE=$(curl -s -X POST "$API_URL/api/pipeline/rules" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Integration Test - Trim Names",
    "type": "TRIM",
    "phase": "CLEAN",
    "target": "name",
    "config": {"sides": "both"},
    "is_active": true,
    "priority": 10
  }')
TRIM_RULE_ID=$(echo $TRIM_RESPONSE | jq -r '.data.rule.id')
echo "   ✅ Created TRIM rule: $TRIM_RULE_ID"

# Create REGEX_REPLACE rule
REGEX_RESPONSE=$(curl -s -X POST "$API_URL/api/pipeline/rules" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Integration Test - Fix Building Names", 
    "type": "REGEX_REPLACE",
    "phase": "CLEAN",
    "target": "building",
    "config": {
      "pattern": "Bldg\\s+(\\d+)",
      "replacement": "Building $1",
      "flags": "gi"
    },
    "is_active": true,
    "priority": 20
  }')
REGEX_RULE_ID=$(echo $REGEX_RESPONSE | jq -r '.data.rule.id')
echo "   ✅ Created REGEX_REPLACE rule: $REGEX_RULE_ID"

# Create UPPERCASE rule
UPPER_RESPONSE=$(curl -s -X POST "$API_URL/api/pipeline/rules" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Integration Test - Uppercase Asset Tags",
    "type": "TO_UPPERCASE", 
    "phase": "TRANSFORM",
    "target": "asset_tag",
    "config": {},
    "is_active": true,
    "priority": 30
  }')
UPPER_RULE_ID=$(echo $UPPER_RESPONSE | jq -r '.data.rule.id')
echo "   ✅ Created TO_UPPERCASE rule: $UPPER_RULE_ID"

# Test 2: Test Rule Engine Service with Multiple Rules
echo -e "${BLUE}✅ Test 2: Test Rule Engine Processes All Rules${NC}"
cd /home/swansonj/projects/USAsset3/apps/backend
npx ts-node -e "
import { PrismaService } from './src/database/prisma.service';
import { RuleProcessorFactory } from './src/pipeline/services/rule-processor.factory';
import { RuleEngineService } from './src/pipeline/services/rule-engine.service';

async function testRuleEngineIntegration() {
  const prismaService = new PrismaService();
  const factory = new RuleProcessorFactory();
  const ruleEngine = new RuleEngineService(prismaService, factory);
  
  console.log('   📊 INTEGRATION TEST - Multiple Rules Processing');
  
  // Test data that should trigger all our rules
  const testData = {
    name: '   HVAC Unit 001   \\t\\n',  // Should be trimmed
    building: 'Bldg 42',                // Should become 'Building 42'  
    asset_tag: 'hvac-001'               // Should become 'HVAC-001'
  };
  
  const context = {
    rowNumber: 1,
    jobId: 'integration-test-job',
    correlationId: 'integration-test-correlation',
    metadata: {}
  };
  
  console.log('   📊 INPUT DATA:');
  console.log('      name: \"' + testData.name.replace(/\\t/g, '\\\\t').replace(/\\n/g, '\\\\n') + '\"');
  console.log('      building: \"' + testData.building + '\"');
  console.log('      asset_tag: \"' + testData.asset_tag + '\"');
  
  try {
    // Process CLEAN phase rules
    console.log('\\n   🧹 CLEAN PHASE:');
    const cleanResult = await ruleEngine.processDataWithRules(testData, 'CLEAN', context);
    
    if (!cleanResult.success) {
      console.log('   ❌ CLEAN phase failed:', cleanResult.errors);
      process.exit(1);
    }
    
    console.log('      ✅ Clean phase success');
    console.log('      name: \"' + cleanResult.data.name + '\"');
    console.log('      building: \"' + cleanResult.data.building + '\"');
    
    // Process TRANSFORM phase rules  
    console.log('\\n   ⚡ TRANSFORM PHASE:');
    const transformResult = await ruleEngine.processDataWithRules(cleanResult.data, 'TRANSFORM', context);
    
    if (!transformResult.success) {
      console.log('   ❌ TRANSFORM phase failed:', transformResult.errors);
      process.exit(1);
    }
    
    console.log('      ✅ Transform phase success');
    console.log('      asset_tag: \"' + transformResult.data.asset_tag + '\"');
    
    console.log('\\n   📊 FINAL OUTPUT:');
    console.log('      name: \"' + transformResult.data.name + '\"');
    console.log('      building: \"' + transformResult.data.building + '\"');
    console.log('      asset_tag: \"' + transformResult.data.asset_tag + '\"');
    
    // Verify expected results
    const nameOk = transformResult.data.name === 'HVAC Unit 001';
    const buildingOk = transformResult.data.building === 'Building 42';
    const tagOk = transformResult.data.asset_tag === 'HVAC-001';
    
    console.log('\\n   🔍 VERIFICATION:');
    console.log(\`      Name trimmed: \${nameOk ? '✅ PASS' : '❌ FAIL'}\`);
    console.log(\`      Building regex: \${buildingOk ? '✅ PASS' : '❌ FAIL'}\`);  
    console.log(\`      Tag uppercase: \${tagOk ? '✅ PASS' : '❌ FAIL'}\`);
    
    if (nameOk && buildingOk && tagOk) {
      console.log('\\n   🎉 ALL INTEGRATION TESTS PASSED!');
    } else {
      console.log('\\n   ❌ SOME INTEGRATION TESTS FAILED');
      process.exit(1);
    }
    
  } catch (error) {
    console.log('   ❌ Integration test failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
  
  await prismaService.\$disconnect();
}

testRuleEngineIntegration().catch(console.error);
"

# Test 3: Test Rule Factory Registry
echo -e "${BLUE}✅ Test 3: Verify All Processors Registered${NC}"
npx ts-node -e "
import { RuleProcessorFactory } from './src/pipeline/services/rule-processor.factory';

function testProcessorRegistry() {
  const factory = new RuleProcessorFactory();
  const supportedTypes = factory.getSupportedTypes();
  
  console.log('   📋 Supported Rule Types:', supportedTypes);
  
  const expectedTypes = ['TRIM', 'REGEX_REPLACE', 'EXACT_REPLACE', 'REMOVE_DUPLICATES', 'TO_UPPERCASE'];
  let allRegistered = true;
  
  for (const type of expectedTypes) {
    const processor = factory.createProcessor(type as any);
    const registered = processor !== null;
    console.log(\`   \${registered ? '✅' : '❌'} \${type}: \${registered ? 'REGISTERED' : 'MISSING'}\`);
    if (!registered) allRegistered = false;
  }
  
  if (allRegistered) {
    console.log('   🎉 ALL PROCESSORS REGISTERED!');
  } else {
    console.log('   ❌ MISSING PROCESSORS');
    process.exit(1);
  }
}

testProcessorRegistry();
"

# Test 4: Cleanup
echo -e "${BLUE}✅ Test 4: Cleanup Test Rules${NC}"
if [[ "$TRIM_RULE_ID" != "null" ]]; then
  curl -s -X DELETE "$API_URL/api/pipeline/rules/$TRIM_RULE_ID" > /dev/null
  echo "   🗑️  Deleted TRIM rule"
fi

if [[ "$REGEX_RULE_ID" != "null" ]]; then
  curl -s -X DELETE "$API_URL/api/pipeline/rules/$REGEX_RULE_ID" > /dev/null
  echo "   🗑️  Deleted REGEX_REPLACE rule"
fi

if [[ "$UPPER_RULE_ID" != "null" ]]; then
  curl -s -X DELETE "$API_URL/api/pipeline/rules/$UPPER_RULE_ID" > /dev/null
  echo "   🗑️  Deleted TO_UPPERCASE rule"
fi

echo ""
echo -e "${GREEN}🎉 RULES PIPELINE INTEGRATION TEST COMPLETE!${NC}"
echo "=============================================="
echo -e "${GREEN}✅ Rules created via API${NC}"
echo -e "${GREEN}✅ Processors registered in factory${NC}"
echo -e "${GREEN}✅ Rule engine processes data correctly${NC}"
echo -e "${GREEN}✅ Multi-phase rule application works${NC}"
echo -e "${GREEN}✅ Data flows through: API → DB → Pipeline → Processors${NC}"
echo ""
echo -e "${YELLOW}🚀 RULES SYSTEM IS FULLY INTEGRATED AND OPERATIONAL!${NC}"