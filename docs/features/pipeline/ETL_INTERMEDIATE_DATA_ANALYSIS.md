# ETL Pipeline Intermediate Data Analysis Report
**Date**: 2025-09-05  
**Issue**: Phase results are empty - no intermediate data being captured  
**Status**: CRITICAL - Data flow broken

## Executive Summary
The ETL pipeline system is not capturing intermediate data at each processing phase. The `phase_results` table is empty despite successful job completion, meaning users cannot access the raw, cleaned, or transformed data at each step.

## Files Involved in ETL Process

### Backend Core Files
```
apps/backend/src/pipeline/
├── controllers/
│   └── pipeline.controller.ts           # HTTP endpoints (/import, /jobs/:id/phase-results)
├── services/
│   ├── pipeline.service.ts             # Main service orchestration
│   ├── pipeline-import.service.ts      # ACTUAL import processing logic
│   ├── pipeline-job.service.ts         # Job lifecycle management  
│   └── csv-parser.service.ts           # CSV parsing utilities
├── repositories/
│   └── pipeline.repository.ts          # Database operations
└── orchestrator/
    └── pipeline-orchestrator.service.ts # Orchestration (currently broken)
```

### Database Schema
```sql
-- Job tracking
import_jobs (id, file_id, status, total_rows, processed_rows, errors, etc.)

-- Phase results (EMPTY - THIS IS THE PROBLEM)
phase_results (id, import_job_id, phase, status, transformations, applied_rules, 
               input_sample, output_sample, rows_processed, metadata, etc.)

-- Processed data
staging_assets (id, import_job_id, raw_data, mapped_data, status, errors, etc.)

-- Final data  
assets (final imported records)
```

### Frontend Files
```
apps/frontend/src/components/pipeline/rules/
├── JobsList.tsx                        # Jobs table with download button
├── RulesManagement.tsx                  # Contains download handler
└── types.ts                            # ImportJob interface
```

## Current Data Flow Analysis

### 1. Import Request Flow
```
POST /api/pipeline/import
└── PipelineController.importData()
    └── PipelineService.importData() 
        └── PipelineImportService.processImport()  ⭐ MAIN PROCESSING
```

### 2. Actual Processing in `processImport()` Method
Located in: `apps/backend/src/pipeline/services/pipeline-import.service.ts:58-93`

```typescript
public async processImport(fileId: string, jobId: string): Promise<void> {
  try {
    await this.startImportJob(jobId);
    
    // EXTRACT PHASE
    const parseResult = await this.csvParserService.parseFile(fileId);
    await this.logPhaseResult(jobId, 'EXTRACT', 'SUCCESS', parseResult.rows.length);
    
    // VALIDATE PHASE  
    if (this.shouldFailImport(parseResult)) {
      await this.logPhaseResult(jobId, 'VALIDATE', 'FAILED', 0);
      await this.failImportJob(jobId, parseResult.errors);
      return;
    }
    await this.logPhaseResult(jobId, 'VALIDATE', 'SUCCESS', parseResult.rows.length);
    
    // CLEAN/TRANSFORM/MAP/LOAD PHASES
    await this.processAndStageData(jobId, parseResult);
    
  } catch (error) {
    await this.handleImportError(jobId, error);
  }
}
```

### 3. Phase Logging Implementation
Located in: `apps/backend/src/pipeline/services/pipeline-import.service.ts:101-127`

```typescript
private async logPhaseResult(
  jobId: string,
  phase: 'EXTRACT' | 'VALIDATE' | 'CLEAN' | 'TRANSFORM' | 'MAP' | 'LOAD',
  status: 'SUCCESS' | 'FAILED',
  rowsProcessed: number,
): Promise<void> {
  try {
    await this.pipelineRepository.savePhaseResult({
      import_job_id: jobId,
      phase,
      status, 
      transformations: [`${phase} completed`],  // ⭐ MINIMAL DATA
      applied_rules: [],
      rows_processed: rowsProcessed,
      rows_modified: 0,
      rows_failed: 0,
      started_at: new Date(),
      completed_at: new Date(), 
      duration_ms: 0,
    });
  } catch (error) {
    this.logger.warn(`Failed to log phase result: ${error.message}`);
  }
}
```

## CRITICAL ISSUES IDENTIFIED

### Issue #1: Phase Logging Not Capturing Actual Data
**Problem**: The `logPhaseResult` calls only save metadata, not the actual intermediate data.

**Current**: `transformations: ["EXTRACT completed"]`  
**Needed**: Raw CSV data, cleaned data, transformed data at each phase

### Issue #2: Missing Phase Result Records in Database
**Verification**:
```sql
SELECT * FROM phase_results WHERE import_job_id = '63ff900e-2de9-4e58-a63f-3259f3d093d9';
-- Result: (0 rows)
```

**Root Cause**: Either the `savePhaseResult` calls are failing silently OR the logging isn't being triggered.

### Issue #3: Actual Data Locations Unknown
**Current Data Storage**:
- Raw CSV data: Unknown location
- Parsed data: `parseResult.rows` (in memory only)
- Staged data: `staging_assets` table
- Final data: `assets` table

**Missing**: Intermediate data at each transformation step

## WHERE THE FUCKING DATA ACTUALLY IS

### Raw CSV Data
**Location**: File system (likely in uploads directory or temp storage)
**Access**: Through `csvParserService.parseFile(fileId)` method
**Content**: Original uploaded CSV content

### Parsed Data (Extract Phase Output)
**Location**: `parseResult.rows` - JavaScript array in memory
**Content**: 
```javascript
parseResult = {
  rows: [
    { "Asset ID": "A001", "Name": "Server 1", "Building": "HQ" },
    { "Asset ID": "A002", "Name": "Laptop 2", "Building": "Branch" }
  ],
  errors: ["Row 5: Invalid date format"]
}
```

### Processed Data (Clean/Transform/Map Output)  
**Location**: `staging_assets` table
**Content**: 
```sql
SELECT raw_data, mapped_data, status, errors 
FROM staging_assets 
WHERE import_job_id = 'job-id';
```

### Final Data (Load Phase Output)
**Location**: `assets` table  
**Content**: Final imported asset records

## RECOMMENDED SOLUTION

### 1. Fix Phase Result Logging
Update `logPhaseResult` to capture actual data:

```typescript
private async logPhaseResult(
  jobId: string,
  phase: PipelinePhase,
  status: string,
  rowsProcessed: number,
  inputData: any[],      // ⭐ ADD INPUT DATA
  outputData: any[],     // ⭐ ADD OUTPUT DATA  
  transformations: string[]
): Promise<void> {
  await this.pipelineRepository.savePhaseResult({
    import_job_id: jobId,
    phase,
    status,
    transformations,
    input_sample: inputData.slice(0, 5),    // First 5 rows
    output_sample: outputData.slice(0, 5),  // First 5 rows  
    rows_processed: rowsProcessed,
    // ... other fields
  });
}
```

### 2. Update Processing Flow
Modify `processImport` to pass actual data:

```typescript
// EXTRACT PHASE
const parseResult = await this.csvParserService.parseFile(fileId);
const rawData = parseResult.rows;
await this.logPhaseResult(jobId, 'EXTRACT', 'SUCCESS', rawData.length, 
                         [], rawData, ['CSV parsed successfully']);

// VALIDATE PHASE  
const validatedData = this.validateData(rawData);
await this.logPhaseResult(jobId, 'VALIDATE', 'SUCCESS', validatedData.length,
                         rawData, validatedData, ['Data validation completed']);

// CLEAN PHASE
const cleanedData = this.cleanData(validatedData);  
await this.logPhaseResult(jobId, 'CLEAN', 'SUCCESS', cleanedData.length,
                         validatedData, cleanedData, ['Data cleaning completed']);
```

### 3. Add Data Access Endpoints
```typescript
// View raw data at specific phase
GET /api/pipeline/jobs/:id/phase-results/:phase/data

// Download data at specific phase  
GET /api/pipeline/jobs/:id/phase-results/:phase/download
```

## IMMEDIATE ACTION ITEMS

1. **Verify Phase Logging**: Check if `savePhaseResult` calls are actually executing
2. **Debug Database Writes**: Add logging to confirm records are being written
3. **Capture Intermediate Data**: Modify phase logging to save actual data samples
4. **Test Data Flow**: Run a test import and verify data capture at each phase

## DATA ACCESS STRATEGY

### For Development/Debugging
1. **Phase Results API**: `GET /api/pipeline/jobs/:id/phase-results` (already exists)
2. **Staging Data API**: `GET /api/pipeline/staged-data` (already exists)
3. **Direct Database Access**: Query `staging_assets` and `phase_results` tables

### For Production Use
1. **Download Phase Results**: JSON file with all intermediate data
2. **Phase-specific Downloads**: CSV files for each processing phase
3. **Data Diff Views**: Show before/after for each transformation

## NEXT STEPS

1. Fix the phase result logging to capture actual intermediate data
2. Test the logging with a sample CSV import
3. Verify data is being written to `phase_results` table  
4. Update frontend download to show meaningful intermediate data
5. Add phase-specific data access endpoints

**Status**: Ready for implementation - all analysis complete.