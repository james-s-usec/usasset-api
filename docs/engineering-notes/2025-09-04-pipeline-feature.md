# Engineering Notes - 2025-01-04

## Morning Standup
- **Yesterday**: Resolved pipeline CSV file visibility blocker, started implementing staging table architecture
- **Today**: Complete data pipeline tracer bullet with staging/preview functionality
- **Blockers**: None currently

## Work Log

### 10:00 - Data Pipeline Feature Implementation
**What**: Built tracer bullet for CSV import pipeline with ETL phases
**Why**: Need ability to import asset data from CSV files with quality gates
**How**: 
- Created modular pipeline architecture with Extract, Transform, Load phases
- Added staging table for data preview before final import
- Built vertical flow UI with Material-UI Stepper
**Result**: Working pipeline that stages data for review before database commit
**Learned**: Staging tables are critical for data quality - users need to preview/audit before committing

### 11:00 - Pipeline Architecture Refactor
**What**: Broke down monolithic PipelineFlow component into smaller, extensible phases
**Why**: Original component was 300+ lines, not maintainable or extensible
**How**: 
- Created separate phase components (ExtractPhase, TransformPhase, LoadPhase)
- Made pipeline configuration array-based for easy extension
- Each component now ~40 lines with single responsibility
**Result**: Clean, extensible architecture ready for future phases
**Learned**: Start with smaller components from the beginning - easier to compose than decompose

## Decisions Made

### Decision: Staging Table for Import Preview #decision
**Context**: Users need to review/validate data before importing to production database
**Options Considered**:
1. Direct import with rollback capability
2. Preview in frontend only
3. Staging table with approval workflow
**Rationale**: Staging table provides audit trail and allows data correction before commit
**Trade-offs**: Extra complexity and storage, but worth it for data integrity

### Decision: Vertical Pipeline Flow UI #decision
**Context**: Need intuitive UI for multi-step import process
**Options Considered**:
1. Wizard-style horizontal steps
2. Tab-based interface
3. Vertical stepper with collapsible phases
**Rationale**: Vertical flow matches mental model of data flowing down through ETL phases
**Trade-offs**: Takes more vertical space, but clearer for users

## Technical Implementation Details

### Completed Components
- ✅ CSV Parser Service (backend)
- ✅ Staging table schema (StagingAsset model)
- ✅ Import job tracking (ImportJob model with STAGED status)
- ✅ Modular phase components (Extract, Transform, Load)
- ✅ Pipeline flow UI with Material-UI Stepper

### Database Schema Additions
```prisma
model StagingAsset {
  id              String     @id @default(uuid())
  import_job_id   String
  row_number      Int
  raw_data        Json       // Original CSV row
  mapped_data     Json       // Mapped to asset fields
  validation_errors Json?    
  is_valid        Boolean    @default(true)
  will_import     Boolean    @default(true)
}
```

## Problems & Solutions

### Problem: Frontend not showing import progress #problem
**Issue**: ImportStatusCard wasn't displaying after clicking "Start Import"
**Debugging**: Checked network requests, found status changing to STAGED
**Solution**: Updated status handling to recognize STAGED status #solution
**Prevention**: Test all status transitions in UI

### Problem: Double response wrapping #problem  
**Issue**: Pipeline API returning nested data structure
**Debugging**: Inspected actual HTTP responses
**Solution**: Fixed response parsing in pipelineApi.ts #solution
**Prevention**: Always check interceptor behavior with new endpoints

## Learning Notes

### TIL: Prisma Cascade Deletes #learned
- `onDelete: Cascade` in relations automatically removes child records
- Perfect for cleaning up staging data when job is deleted

### Pattern: Extensible Pipeline Configuration #learned
```typescript
const PIPELINE_PHASES = [
  { label: 'Extract', component: ExtractPhase },
  { label: 'Transform', component: TransformPhase },
  // Easy to add new phases here
];
```

## Tomorrow's Priority
1. **Add staging data preview table** - Users need to see actual data before approving
2. **Implement approve/reject endpoints** - Backend needs to handle quality gate decisions  
3. **Add commit to database functionality** - Move approved data from staging to assets table
4. **Create data validation rules** - Basic field validation before staging

## Next Steps for Pipeline Feature

### Immediate (Phase 1 Completion)
- [ ] Create preview table component showing staged data
- [ ] Add GET endpoint for retrieving staging data by job ID
- [ ] Implement approve endpoint to move staging → assets
- [ ] Add reject endpoint to cancel and clean up staging
- [ ] Show validation errors in preview table

### Phase 2 Preparation
- [ ] Design rule configuration schema
- [ ] Plan cleaning orchestrator pattern
- [ ] Research fuzzy matching libraries for reference data

### Technical Debt to Address
- [ ] Add proper TypeScript types for staging data
- [ ] Implement proper error boundaries in pipeline components
- [ ] Add loading states for all async operations
- [ ] Create unit tests for CSV parser

## Commands & Snippets Used Today

```bash
# Useful debugging commands
curl -s http://localhost:3000/api/pipeline/status/{jobId} | jq
npx prisma migrate dev --name add_staging_table
npm run typecheck

# Check import job in database
psql -h localhost -p 5433 -U dbadmin -d usasset \
  -c "SELECT * FROM import_jobs WHERE id = 'job-id';"
```

---
Tags: #pipeline #etl #staging #architecture #decision