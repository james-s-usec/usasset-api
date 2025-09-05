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

# Engineering Notes - 2025-09-04

## Morning Standup
- **Yesterday**: N/A (continuing pipeline work)
- **Today**: Complete CSV import pipeline validation and field mapping fixes
- **Blockers**: Database field mapping issues preventing successful imports

## Work Log

### 18:28 - Pipeline Memory Issue Resolution
**What**: Fixed JavaScript heap out of memory errors during CSV processing
**Why**: Large CSV files were causing memory overflow during JSON serialization
**How**: 
- Added data truncation (200 chars for staging, 100 for preview)
- Limited preview to 10 rows max
- Added proper memory management constants
**Result**: Memory errors resolved, pipeline stable
**Learned**: Always truncate large data values before JSON serialization #learned

### 18:35 - Emergency Cleanup System
**What**: Implemented comprehensive cleanup endpoints
**Why**: Need to clear staging data and old jobs to prevent memory buildup
**How**: 
- Added `POST /api/pipeline/cleanup` for old jobs (24+ hours)
- Added `POST /api/pipeline/cleanup/all` for emergency cleanup
- Clears import jobs, staging data, and logs
**Result**: Successfully cleared 22 jobs, 470 staging records, 377 logs
**Learned**: Always need cleanup mechanisms for staging systems #solution

### 18:40 - Phase 3 Validation Implementation  
**What**: Added validation button to Load Phase (Phase 3) with database field preview
**Why**: User needed to see actual database mappings before approve/reject
**How**:
- Added "Validate Staging Data" button to LoadPhaseActions component
- Shows actual database field mappings (assetTag, name, roomNumber, condition, etc.)
- Displays sample of what will be imported to assets table
**Result**: User can now preview exact database fields before import
**Learned**: Always show users what will actually happen, not just counts #decision

### 18:45 - Approve/Reject User Experience Fix
**What**: Fixed annoying auto-reload after approve/reject actions
**Why**: User couldn't see success/failure feedback due to immediate page reload
**How**:
- Removed `setTimeout(() => window.location.reload(), 2000)` from both approve/reject
- Added proper success/failure message display
- Added "Start New Import" button for workflow continuation
**Result**: User gets clear feedback and can continue workflow without page reload
**Learned**: Never auto-reload without user consent - breaks UX flow #decision

### 18:47 - Database Field Mapping Bug Discovery
**What**: Import still failing with 0 assets imported due to field mapping errors
**Why**: Backend still using old field names (room/condition_assessment) vs schema (roomNumber/condition)
**How**: 
- Analyzed error logs showing `Unknown argument 'room'` Prisma errors
- Fixed mapping: `room` → `roomNumber`, `condition_assessment` → `condition`
- Hot reload should have picked up changes
**Result**: Fixed code but backend may need restart
**Learned**: Always verify field names match exact database schema #problem

## Decisions Made

- **Decision**: Truncate data values instead of limiting rows
  **Context**: Memory issues with large CSV files
  **Options Considered**: Row limits, complete data, streaming
  **Rationale**: Preserves row count while preventing memory overflow
  **Trade-offs**: Lose some data fidelity for stability

- **Decision**: Remove auto-reload from approve/reject actions
  **Context**: User needs immediate feedback on import results
  **Options Considered**: Keep reload, add delay, remove entirely
  **Rationale**: User experience over convenience - feedback is critical
  **Trade-offs**: Slightly more complex state management

- **Decision**: Add validation to Phase 3 (Load) instead of Phase 1 (Extract)
  **Context**: User wants to validate transformed/staged data before import
  **Options Considered**: Phase 1 validation, Phase 2 validation, both
  **Rationale**: Most valuable to see final database mappings before commit
  **Trade-offs**: More complex component but better user experience

## Code Reviews
- Pipeline validation UX: Much improved, shows actual database fields
- Memory management: Proper truncation and cleanup systems in place
- Error handling: Clear correlation IDs and detailed logging

## Learning Notes
- **TIL**: Prisma field names must match schema exactly - `room` vs `roomNumber` breaks silently #learned
- **Tool discovered**: `curl "http://localhost:3000/logs?level=ERROR"` for quick error debugging
- **Pattern identified**: Always add cleanup endpoints for staging systems #solution

## Current Status
✅ **Completed**: 
- Memory issue fixes with data truncation
- Phase 3 validation showing database field mappings  
- Emergency cleanup system (cleared all staging data)
- Approve/reject UX improvements (no auto-reload)
- Field mapping fixes (room → roomNumber, condition_assessment → condition)

🔄 **In Progress**:
- Database field mapping verification (backend may need restart)

## Tomorrow's Priority
1. **CRITICAL**: Verify backend restart picked up field mapping fixes
2. **CRITICAL**: Test complete end-to-end import flow (select → validate → approve → verify in database)
3. **Enhancement**: Add extensible ETL rules infrastructure (prepare for data extraction guide implementation)

## Technical Debt Identified
- Need better hot-reload verification system
- Should add database field validation in development mode
- Need automated e2e testing for pipeline flow

## Next Session Notes
**Context**: Working on CSV import pipeline for USAsset system. User can select files, see raw preview, process to staging, validate mappings, and approve/reject for final import.

**Current Issue**: Import returns "0 assets imported" due to database field mapping mismatch. Backend service uses `room`/`condition_assessment` but database schema expects `roomNumber`/`condition`. Fixed in code but hot reload may not have applied changes.

**Immediate Next Steps**:
1. Verify `curl http://localhost:3000/health` shows recent restart (uptime should be low)
2. Test approve import again - should now show > 0 assets imported
3. If still failing, manually restart backend with `npm run start:dev`
4. Once working, begin planning extensible ETL rules system

**Files Modified Today**:
- `apps/backend/src/pipeline/pipeline.service.ts` - Field mapping fixes, memory management
- `apps/frontend/src/components/pipeline/components/LoadPhaseActions.tsx` - Phase 3 validation
- `apps/frontend/src/components/pipeline/hooks/usePipelineActions.ts` - UX improvements
- Multiple other pipeline components for validation flow

**Key Achievement**: Pipeline now shows users exactly what database fields will be created before import - much better UX for data validation.