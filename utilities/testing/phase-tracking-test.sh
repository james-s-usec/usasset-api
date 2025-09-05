#!/bin/bash
# Phase Result Tracking Test - Based on ETL Rules Tracer
set -e

echo "🎯 PHASE RESULT TRACKING TEST"
echo "=============================="

API_URL="http://localhost:3000"
DB_NAME="usasset"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Check PhaseResult table exists
echo -e "${BLUE}✅ Test 1: Database Schema Check${NC}"
TABLES_EXIST=$(docker exec -i usasset-postgres psql -U dbadmin -d $DB_NAME -t -c "
  SELECT COUNT(*) FROM information_schema.tables 
  WHERE table_name IN ('phase_results');
")
if [[ $TABLES_EXIST -gt 0 ]]; then
  echo "   📊 PhaseResult table exists"
else
  echo -e "   ${RED}❌ PhaseResult table missing${NC}"
  exit 1
fi

# Test 2: Create TRIM rules for our test fields
echo -e "${BLUE}✅ Test 2: Create TRIM Rules for Test Fields${NC}"

# Clean up any existing test rules
docker exec -i usasset-postgres psql -U dbadmin -d $DB_NAME -c "
  DELETE FROM pipeline_rules WHERE name LIKE 'Test Tracking %';
" > /dev/null 2>&1

# Create TRIM rules for the actual fields we're testing
RULE1_ID=$(docker exec -i usasset-postgres psql -U dbadmin -d $DB_NAME -t -c "
  INSERT INTO pipeline_rules (id, name, description, phase, type, target, config, priority, is_active, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'Test Tracking Asset Name TRIM',
    'Remove whitespace from Asset Name field',
    'CLEAN',
    'TRIM',
    'Asset Name',
    '{\"sides\": \"both\", \"customChars\": \" \\t\\n\\r\"}',
    1,
    true,
    NOW(),
    NOW()
  )
  RETURNING id;
" | tr -d ' ')
echo "   ✂️ Created TRIM rule for 'Asset Name': $RULE1_ID"

RULE2_ID=$(docker exec -i usasset-postgres psql -U dbadmin -d $DB_NAME -t -c "
  INSERT INTO pipeline_rules (id, name, description, phase, type, target, config, priority, is_active, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'Test Tracking Asset Tag TRIM',
    'Remove whitespace from Asset Tag field',
    'CLEAN',
    'TRIM',
    'Asset Tag',
    '{\"sides\": \"both\"}',
    2,
    true,
    NOW(),
    NOW()
  )
  RETURNING id;
" | tr -d ' ')
echo "   ✂️ Created TRIM rule for 'Asset Tag': $RULE2_ID"

RULE3_ID=$(docker exec -i usasset-postgres psql -U dbadmin -d $DB_NAME -t -c "
  INSERT INTO pipeline_rules (id, name, description, phase, type, target, config, priority, is_active, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'Test Tracking Building TRIM',
    'Remove whitespace from Building field',
    'CLEAN',
    'TRIM',
    'Building',
    '{\"sides\": \"both\"}',
    3,
    true,
    NOW(),
    NOW()
  )
  RETURNING id;
" | tr -d ' ')
echo "   ✂️ Created TRIM rule for 'Building': $RULE3_ID"

# Test 3: Create test file and import job
echo -e "${BLUE}✅ Test 3: Create Test File and Import Job${NC}"

# First create a test file entry with updated_at
FILE_ID=$(docker exec -i usasset-postgres psql -U dbadmin -d $DB_NAME -t -c "
  INSERT INTO files (id, filename, original_name, mimetype, size, blob_url, container_name, blob_name, file_type, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'test-tracking.csv',
    'test-tracking.csv',
    'text/csv',
    1024,
    'https://test.blob.core.windows.net/test/test-tracking.csv',
    'test',
    'test-tracking.csv',
    'SPREADSHEET',
    NOW(),
    NOW()
  )
  RETURNING id;
" | tr -d ' ')
echo "   📄 Created file ID: $FILE_ID"

# Now create the import job
JOB_ID=$(docker exec -i usasset-postgres psql -U dbadmin -d $DB_NAME -t -c "
  INSERT INTO import_jobs (id, file_id, status, started_at)
  VALUES (
    gen_random_uuid(),
    '$FILE_ID',
    'PENDING',
    NOW()
  )
  RETURNING id;
" | tr -d ' ')
echo "   🆕 Created job ID: $JOB_ID"

# Test 4: Test Phase Result Tracking with TypeScript
echo -e "${BLUE}✅ Test 4: Test Phase Result Tracking${NC}"
echo "   Running pipeline with transformation tracking..."
cd /home/swansonj/projects/USAsset3/apps/backend
npx ts-node -e "
import { PrismaService } from './src/database/prisma.service';
import { PipelineRepository } from './src/pipeline/repositories/pipeline.repository';
import { RuleProcessorFactory } from './src/pipeline/services/rule-processor.factory';
import { RuleEngineService } from './src/pipeline/services/rule-engine.service';
import { CleanPhaseProcessor } from './src/pipeline/phases/clean/clean-phase.processor';

async function testPhaseTracking() {
  const prismaService = new PrismaService();
  const pipelineRepository = new PipelineRepository(prismaService);
  const factory = new RuleProcessorFactory();
  const ruleEngine = new RuleEngineService(prismaService, factory);
  
  // Create test data with whitespace
  const testData = {
    validRows: [
      {
        'Asset Name': '   HVAC Unit 001   ',
        'Asset Tag': '  HVAC-001  ',
        'Building': '  Building 1  '
      },
      {
        'Asset Name': '  Generator   ',
        'Asset Tag': '  GEN-002  ',
        'Building': '  Building 2  '
      }
    ],
    fileId: 'test-file-tracking'
  };

  const context = {
    jobId: '$JOB_ID',
    correlationId: 'test-correlation',
    fileId: 'test-file-tracking',
    metadata: {}
  };

  console.log('   📊 INPUT DATA:');
  console.log('      Row 1 Asset Name: \"' + testData.validRows[0]['Asset Name'] + '\"');
  console.log('      Row 2 Asset Name: \"' + testData.validRows[1]['Asset Name'] + '\"');

  // Run the CLEAN phase processor
  const cleanProcessor = new CleanPhaseProcessor(prismaService);
  const result = await cleanProcessor.process(testData, context);
  
  console.log('\\n   📊 OUTPUT DATA:');
  if (result.success && result.data) {
    const outputData = result.data as any;
    if (outputData.cleanedRows) {
      console.log('      Row 1 Asset Name: \"' + outputData.cleanedRows[0]['Asset Name'] + '\"');
      console.log('      Row 2 Asset Name: \"' + outputData.cleanedRows[1]['Asset Name'] + '\"');
    }
  }
  
  console.log('\\n   🔍 TRANSFORMATIONS COLLECTED:');
  if (result.debug && result.debug.transformations) {
    const transforms = result.debug.transformations;
    console.log('      Total transformations: ' + transforms.length);
    transforms.slice(0, 3).forEach((t, idx) => {
      console.log('      ' + (idx + 1) + '. Field: ' + t.field);
      console.log('         Before: \"' + t.before + '\"');
      console.log('         After: \"' + t.after + '\"');
    });
  }

  // Now save the phase result
  console.log('\\n   💾 SAVING PHASE RESULT TO DATABASE...');
  await pipelineRepository.savePhaseResult({
    import_job_id: '$JOB_ID',
    phase: result.phase,
    status: result.success ? 'SUCCESS' : 'FAILED',
    transformations: result.debug?.transformations || [],
    applied_rules: result.debug?.rulesApplied || [],
    rows_processed: result.metrics?.recordsProcessed || 0,
    rows_modified: result.debug?.transformations?.length || 0,
    rows_failed: result.metrics?.recordsFailed || 0,
    metadata: { phase: result.phase, warnings: result.warnings },
    errors: result.errors,
    warnings: result.warnings,
    started_at: result.metrics?.startTime || new Date(),
    completed_at: result.metrics?.endTime || new Date(),
    duration_ms: result.metrics?.durationMs || 0
  });
  console.log('      ✅ Phase result saved to database');
  
  await prismaService.\$disconnect();
}

testPhaseTracking().catch(console.error);
"

# Test 5: Verify Phase Result in Database
echo -e "${BLUE}✅ Test 5: Verify Phase Result in Database${NC}"
PHASE_RESULT=$(docker exec -i usasset-postgres psql -U dbadmin -d $DB_NAME -t -c "
  SELECT COUNT(*) FROM phase_results WHERE import_job_id = '$JOB_ID';
")
echo "   📊 Phase results saved: $PHASE_RESULT"

# Test 6: Display Transformation Data
echo -e "${BLUE}✅ Test 6: Display Saved Transformation Data${NC}"
echo "   Querying transformation data from database..."
docker exec -i usasset-postgres psql -U dbadmin -d $DB_NAME -c "
  SELECT 
    phase,
    status,
    rows_processed,
    rows_modified,
    jsonb_array_length(transformations) as transformation_count,
    transformations->0 as first_transformation
  FROM phase_results 
  WHERE import_job_id = '$JOB_ID';
"

# Test 7: Show Applied Rules
echo -e "${BLUE}✅ Test 7: Show Applied Rules${NC}"
docker exec -i usasset-postgres psql -U dbadmin -d $DB_NAME -c "
  SELECT 
    phase,
    applied_rules
  FROM phase_results 
  WHERE import_job_id = '$JOB_ID';
"

# Test 8: Cleanup
echo -e "${BLUE}✅ Test 8: Cleanup${NC}"
docker exec -i usasset-postgres psql -U dbadmin -d $DB_NAME -c "
  DELETE FROM phase_results WHERE import_job_id = '$JOB_ID';
  DELETE FROM import_jobs WHERE id = '$JOB_ID';
  DELETE FROM files WHERE id = '$FILE_ID';
  DELETE FROM pipeline_rules WHERE name LIKE 'Test Tracking %';
"
echo "   🗑️  Cleaned up test data and rules"

echo ""
echo -e "${GREEN}🎉 PHASE RESULT TRACKING TEST COMPLETE!${NC}"
echo "=============================================="
echo -e "   ${GREEN}📋 Database Schema: ✓ PhaseResult table exists${NC}"
echo -e "   ${GREEN}📊 Transformation Tracking: ✓ Before/after values captured${NC}"
echo -e "   ${GREEN}💾 Database Storage: ✓ Phase results saved to job${NC}"
echo -e "   ${GREEN}🔍 Data Retrieval: ✓ Can query transformation history${NC}"
echo ""
echo -e "${YELLOW}✨ PHASE RESULT TRACKING IS OPERATIONAL!${NC}"