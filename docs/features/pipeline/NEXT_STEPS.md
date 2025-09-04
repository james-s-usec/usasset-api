# Pipeline Implementation - Next Steps

## Current Status ✅
**Phase 1: Foundation (Partially Complete)**
- ✅ Pipeline route and navigation
- ✅ PipelinePage with tabbed interface  
- ✅ FileSelectionModal component working
- ✅ Backend pipeline module created
- ✅ Core API endpoints stubbed
- ✅ File listing integration with AzureBlobStorageService

## Immediate Next Steps (Phase 1 Completion)

### 1. CSV Parser Service Implementation
**Priority: HIGH**
```typescript
// apps/backend/src/pipeline/services/csv-parser.service.ts
- Integrate with AzureBlobStorageService.getFileContentAsText()
- Parse CSV headers and detect columns
- Map CSV columns to Asset model fields
- Handle parsing errors gracefully
```

### 2. Import Job Database Schema
**Priority: HIGH**
```bash
# Add to prisma/schema.prisma
model ImportJob {
  id              String     @id @default(uuid())
  file_id         String
  status          JobStatus  @default(PENDING)
  total_rows      Int?
  processed_rows  Int        @default(0)
  error_rows      Int        @default(0)
  errors          Json[]     @default([])
  started_at      DateTime   @default(now())
  completed_at    DateTime?
  created_by      String?
  
  file            File       @relation(fields: [file_id], references: [id])
}

enum JobStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}

# Run migration
npx prisma migrate dev --name add_import_job
```

### 3. Import Status Component
**Priority: MEDIUM**
```typescript
// apps/frontend/src/components/pipeline/ImportStatusCard.tsx
- Progress indicator during import
- Success/error summary display
- Show rows processed vs errors
- Real-time updates (polling initially)
```

### 4. Wire Up Actual Import Logic
**Priority: HIGH**
```typescript
// Update pipeline.service.ts startImport method:
1. Create ImportJob record
2. Fetch CSV content from blob storage
3. Parse CSV and validate headers
4. Process rows into Asset records
5. Update job status and metrics
6. Return job ID for status tracking
```

## Technical Implementation Details

### CSV to Asset Field Mapping
```typescript
// Minimal viable mapping for Phase 1
const FIELD_MAPPING = {
  'Asset ID': 'asset_tag',
  'Name': 'name',
  'Building': 'building_name',
  'Floor': 'floor',
  'Room': 'room',
  'Status': 'status',
  'Condition': 'condition_assessment',
  // Add more as needed
};
```

### Error Handling Strategy
1. **Row-level errors**: Collect and continue
2. **File-level errors**: Fail fast with clear message
3. **Validation errors**: Log with row number and field
4. **System errors**: Rollback transaction

## Testing Requirements

### Backend Tests
```bash
# Unit tests
- csv-parser.service.spec.ts
- pipeline.service.spec.ts (update with real logic)

# Integration tests  
- pipeline.controller.e2e-spec.ts
```

### Frontend Tests
```bash
# Component tests
- FileSelectionModal.test.tsx
- ImportStatusCard.test.tsx
```

## Phase 2 Preview (Data Cleaning)
Once Phase 1 is complete:
1. Data Cleaning Orchestrator pattern
2. Rule-based transformations
3. Strategy pattern for processors
4. Rules database schema

## Blockers Resolved ✅
- CSV files not showing: Fixed response structure mismatch
- API integration: Corrected nested data access pattern

## Time Estimate
- CSV Parser Service: 2-3 hours
- Import Job Schema: 1 hour  
- Import Status Component: 2 hours
- Wire up import logic: 3-4 hours
- Testing: 2-3 hours

**Total: ~10-14 hours to complete Phase 1**

## Commands for Next Session
```bash
# Backend work
cd apps/backend
npx nest g service pipeline/services/csv-parser --flat
npx prisma migrate dev --name add_import_job

# Frontend work  
cd apps/frontend
# Create ImportStatusCard component

# Testing
npm run test:e2e pipeline
npm run ci
```