import { PrismaClient } from '@prisma/client';
import { RuleProcessorFactory } from './services/rule-processor.factory';
import { RuleEngineService } from './services/rule-engine.service';
import { PrismaService } from '../database/prisma.service';

async function testHotReload() {
  const prisma = new PrismaClient();
  const processorFactory = new RuleProcessorFactory();
  const prismaService = new PrismaService();
  const ruleEngine = new RuleEngineService(prismaService, processorFactory);

  console.log('🧪 Testing Extensible ETL Rules Hot-Reload Capability\n');

  try {
    // Clean up any existing test rules
    await prisma.pipelineRule.deleteMany({
      where: { name: 'Test Trim Rule' },
    });

    // 1. Create a TRIM rule in the database
    console.log('1️⃣  Creating TRIM rule in database...');
    const rule = await ruleEngine.createRule({
      name: 'Test Trim Rule',
      description: 'Test rule for hot-reload capability',
      phase: 'CLEAN',
      type: 'TRIM',
      target: 'name',
      config: {
        sides: 'both',
        customChars: ' \t\n\r',
      },
      priority: 1,
    });
    console.log('✅ Rule created:', rule.name);

    // 2. Test processing data with the rule
    console.log('\n2️⃣  Testing data processing with TRIM rule...');
    const testData = {
      name: '  John Doe  \t\n',
      assetTag: 'A001',
    };

    const context = {
      rowNumber: 1,
      jobId: 'test-job',
      correlationId: 'test-correlation',
      metadata: {},
    };

    const result1 = await ruleEngine.processDataWithRules(
      testData,
      'CLEAN',
      context,
    );
    console.log('📊 Input data:', JSON.stringify(testData));
    console.log('📊 Processed data:', JSON.stringify(result1.data));
    console.log('✅ Success:', result1.success);
    console.log('⚠️  Warnings:', result1.warnings);

    if (result1.errors.length > 0) {
      console.log('❌ Errors:', result1.errors);
    }

    // 3. Update the rule configuration (hot-reload test)
    console.log('\n3️⃣  Updating rule configuration (left trim only)...');
    await prisma.pipelineRule.update({
      where: { id: rule.id },
      data: {
        config: {
          sides: 'left',
          customChars: ' \t\n\r',
        },
      },
    });
    console.log('✅ Rule configuration updated');

    // 4. Test that the change takes effect immediately
    console.log(
      '\n4️⃣  Testing hot-reload - processing same data with updated rule...',
    );
    const result2 = await ruleEngine.processDataWithRules(
      testData,
      'CLEAN',
      context,
    );
    console.log('📊 Input data:', JSON.stringify(testData));
    console.log('📊 Processed data:', JSON.stringify(result2.data));
    console.log('✅ Success:', result2.success);
    console.log('⚠️  Warnings:', result2.warnings);

    if (result2.errors.length > 0) {
      console.log('❌ Errors:', result2.errors);
    }

    // 5. Verify different results
    console.log('\n5️⃣  Comparing results...');
    const name1 = result1.data.name;
    const name2 = result2.data.name;

    console.log(`First result (both): "${name1}"`);
    console.log(`Second result (left): "${name2}"`);

    if (name1 !== name2) {
      console.log(
        '🎉 HOT-RELOAD SUCCESS: Rules loaded dynamically from database!',
      );
    } else {
      console.log(
        '❌ HOT-RELOAD FAILED: Results are identical when they should differ',
      );
    }

    // 6. Test supported rule types
    console.log('\n6️⃣  Checking supported rule types...');
    const supportedTypes = processorFactory.getSupportedTypes();
    console.log('📋 Supported rule types:', supportedTypes);

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.pipelineRule.deleteMany({
      where: { name: 'Test Trim Rule' },
    });

    console.log('\n✅ Hot-reload test completed successfully!');
  } catch (error) {
    console.error(
      '❌ Test failed:',
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  } finally {
    await prisma.$disconnect();
    await prismaService.$disconnect();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testHotReload()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { testHotReload };
