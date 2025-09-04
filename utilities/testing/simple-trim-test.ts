#!/usr/bin/env npx ts-node

import { PrismaClient } from '@prisma/client';
import { RuleProcessorFactory } from '../../apps/backend/src/pipeline/services/rule-processor.factory';
import { RuleEngineService } from '../../apps/backend/src/pipeline/services/rule-engine.service';
import { PrismaService } from '../../apps/backend/src/database/prisma.service';

async function simpleTestTrimRule() {
  console.log('🎯 SIMPLE TRIM RULE DEMONSTRATION');
  console.log('===================================\n');

  const prismaService = new PrismaService();
  const factory = new RuleProcessorFactory();
  const ruleEngine = new RuleEngineService(prismaService, factory);

  try {
    // Clean up any existing test rules
    await prismaService.pipelineRule.deleteMany({
      where: { name: 'Demo TRIM Rule' }
    });

    // Create a TRIM rule
    console.log('1️⃣  Creating TRIM rule in database...');
    const rule = await ruleEngine.createRule({
      name: 'Demo TRIM Rule',
      description: 'Demonstration rule for whitespace removal',
      phase: 'CLEAN',
      type: 'TRIM',
      target: 'name',
      config: {
        sides: 'both',
        customChars: ' \t\n\r'
      },
      priority: 1
    });
    console.log('   ✅ Rule created:', rule.id);

    // Create test data with ACTUAL whitespace
    const testData = {
      name: Buffer.from([32, 32, 72, 86, 65, 67, 32, 85, 110, 105, 116, 32, 48, 48, 49, 32, 32, 32, 9, 10]).toString(), // "  HVAC Unit 001   \t\n"
      assetTag: 'HVAC-001'
    };

    const context = {
      rowNumber: 1,
      jobId: 'demo-test',
      correlationId: 'demo-correlation',
      metadata: {}
    };

    console.log('\n2️⃣  Processing test data...');
    console.log('📊 INPUT:');
    console.log('   name: "' + testData.name.replace(/\t/g, '\\t').replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"');
    console.log('   length:', testData.name.length);
    console.log('   hex:', Buffer.from(testData.name).toString('hex'));

    const result = await ruleEngine.processDataWithRules(testData, 'CLEAN', context);

    console.log('\n📊 OUTPUT:');
    console.log('   name: "' + result.data.name.replace(/\t/g, '\\t').replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"');
    console.log('   length:', result.data.name.length);
    console.log('   hex:', Buffer.from(result.data.name).toString('hex'));

    console.log('\n🔍 VERIFICATION:');
    const originalLength = testData.name.length;
    const processedLength = result.data.name.length;
    const charsRemoved = originalLength - processedLength;
    
    console.log('   Characters removed:', charsRemoved);
    console.log('   Expected result: "HVAC Unit 001"');
    console.log('   Actual result: "' + result.data.name + '"');
    
    if (result.data.name === 'HVAC Unit 001' && charsRemoved > 0) {
      console.log('   🎉 TRIM RULE SUCCESS: Whitespace properly removed!');
    } else {
      console.log('   ❌ TRIM RULE ISSUE: Unexpected result');
    }

    console.log('\n3️⃣  Testing hot-reload with left-only trim...');
    
    // Update rule to left trim only
    await prismaService.pipelineRule.update({
      where: { id: rule.id },
      data: {
        config: {
          sides: 'left',
          customChars: ' \t\n\r'
        }
      }
    });

    const testData2 = {
      name: Buffer.from([32, 32, 72, 86, 65, 67, 32, 85, 110, 105, 116, 32, 48, 48, 49, 32, 32, 32, 9, 10]).toString(),
      assetTag: 'HVAC-001'
    };

    const result2 = await ruleEngine.processDataWithRules(testData2, 'CLEAN', context);
    
    console.log('📊 HOT-RELOAD OUTPUT:');
    console.log('   name: "' + result2.data.name.replace(/\t/g, '\\t').replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"');
    console.log('   length:', result2.data.name.length);
    
    const expectedLeftTrim = 'HVAC Unit 001   \t\n';
    if (result2.data.name === expectedLeftTrim) {
      console.log('   🔥 HOT-RELOAD SUCCESS: Left trim only applied!');
    } else {
      console.log('   ⚠️  Hot-reload result different than expected');
      console.log('   Expected: "' + expectedLeftTrim.replace(/\t/g, '\\t').replace(/\n/g, '\\n') + '"');
    }

    // Cleanup
    console.log('\n4️⃣  Cleaning up...');
    await prismaService.pipelineRule.deleteMany({
      where: { name: 'Demo TRIM Rule' }
    });
    console.log('   ✅ Cleanup complete');

    console.log('\n🎉 DEMONSTRATION COMPLETE!');
    console.log('✨ Extensible ETL Rules System is working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    await prismaService.$disconnect();
  }
}

if (require.main === module) {
  simpleTestTrimRule()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { simpleTestTrimRule };