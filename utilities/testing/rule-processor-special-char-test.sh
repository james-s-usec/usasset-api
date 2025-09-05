#!/bin/bash
# Special Character Remover Processor Smoke Test - Happy Path
set -e

echo "🎯 SPECIAL CHAR REMOVER PROCESSOR: Smoke Test"
echo "============================================="

cd /home/swansonj/projects/USAsset3/apps/backend

# Test Processor directly
echo -e "\033[0;34m✅ Test 1: Test Special Char Removal\033[0m"
npx ts-node -e "
import { SpecialCharRemoverProcessor } from './src/pipeline/processors/clean/special-char-remover.processor';

async function testProcessor() {
  const processor = new SpecialCharRemoverProcessor();
  
  // Test cases
  const testCases = [
    { 
      input: 'Hello@World#2024!', 
      config: { preserveSpaces: false, replaceWith: '' },
      expected: 'HelloWorld2024'
    },
    { 
      input: 'User-Name_123', 
      config: { keepChars: '-_', preserveSpaces: false },
      expected: 'User-Name_123'
    },
    { 
      input: 'Price: \$99.99', 
      config: { keepChars: '.', preserveSpaces: true, replaceWith: '' },
      expected: 'Price 99.99'
    },
    { 
      input: 'email@example.com', 
      config: { keepChars: '@.', preserveSpaces: false },
      expected: 'email@example.com'
    },
    {
      input: 'Special!@#\$%^&*()Characters',
      config: { preserveSpaces: false, replaceWith: '_' },
      expected: 'Special__________Characters'
    }
  ];
  
  const context = {
    rowNumber: 1,
    jobId: 'test-job',
    correlationId: 'test-correlation',
    metadata: {}
  };
  
  console.log('   📊 TEST CASES:');
  let allPassed = true;
  
  for (const testCase of testCases) {
    const result = await processor.process(testCase.input, testCase.config, context);
    const passed = result.data === testCase.expected;
    allPassed = allPassed && passed;
    
    console.log(\`      \${passed ? '✅' : '❌'} '\${testCase.input}'\`);
    console.log(\`         Config: keepChars='\${testCase.config.keepChars || ''}', spaces=\${testCase.config.preserveSpaces}, replace='\${testCase.config.replaceWith || ''}'\`);
    console.log(\`         → '\${result.data}' (expected: '\${testCase.expected}')\`);
    
    if (!passed) {
      console.log(\`         FAILED: Got '\${result.data}' instead\`);
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

# Test 2: Config Validation
echo -e "\033[0;34m✅ Test 2: Test Config Validation\033[0m"
npx ts-node -e "
import { SpecialCharRemoverProcessor } from './src/pipeline/processors/clean/special-char-remover.processor';

async function testValidation() {
  const processor = new SpecialCharRemoverProcessor();
  
  // Valid config
  const validConfig = {
    keepChars: '.-_',
    preserveSpaces: true,
    replaceWith: ''
  };
  
  const validResult = await processor.validateConfig(validConfig);
  console.log(\`   ✅ Valid config: \${validResult.success ? 'PASSED' : 'FAILED'}\`);
  
  // Empty config (should still be valid with defaults)
  const emptyConfig = {};
  const emptyResult = await processor.validateConfig(emptyConfig);
  console.log(\`   ✅ Empty config with defaults: \${emptyResult.success ? 'PASSED' : 'FAILED'}\`);
}

testValidation().catch(console.error);
"

echo ""
echo -e "\033[0;32m🎉 SPECIAL CHAR REMOVER PROCESSOR TEST COMPLETE!\033[0m"
echo "============================================="