<!--
  USAsset Pipeline Processing System Documentation
  
  Purpose: ETL pipeline for data processing with extensible rules engine
  Audience: Backend developers working with data processing
  Last Updated: 2025-09-05
  Version: 1.0
-->

# Pipeline Processing System

## Overview
Comprehensive ETL (Extract, Transform, Load) pipeline system with extensible rules engine for processing CSV data through multiple phases with validation, cleaning, and transformation capabilities.

## Architecture

### Core Components
- **Pipeline Orchestrator**: Manages overall pipeline execution
- **Phase Processors**: Handle individual processing phases
- **Rules Engine**: Extensible rule processing system
- **Job Management**: Track and monitor pipeline jobs
- **Validation System**: Data integrity and quality checks

### Processing Phases
```
1. EXTRACT   → Parse and load CSV data
2. VALIDATE  → Check data integrity and business rules
3. CLEAN     → Apply cleaning rules (trim, normalize)
4. TRANSFORM → Apply transformation rules (format, convert)
5. MAP       → Map fields to target schema
6. LOAD      → Import to final destination
```

## Project Structure
```
src/pipeline/
├── constants/
│   └── pipeline.constants.ts      # Phase durations, status values
├── dto/
│   └── pipeline-dto.ts            # Request/response DTOs
├── interfaces/
│   ├── pipeline-types.ts          # Core type definitions
│   ├── pipeline.interfaces.ts     # Service contracts
│   └── rule-processor.interface.ts # Rule processing contracts
├── orchestrator/
│   ├── phase-processor.interface.ts # Phase processor contract
│   └── pipeline-orchestrator.service.ts # Main orchestration logic
├── phases/
│   ├── extract/
│   │   └── extract-phase.processor.ts  # CSV parsing and loading
│   ├── validate/
│   │   └── validate-phase.processor.ts # Data validation
│   ├── clean/
│   │   └── clean-phase.processor.ts    # Data cleaning
│   ├── transform/
│   │   └── transform-phase.processor.ts # Data transformation
│   ├── map/
│   │   └── map-phase.processor.ts      # Field mapping
│   └── load/
│       └── load-phase.processor.ts     # Final data loading
├── processors/
│   └── clean/
│       └── trim.processor.ts           # Specific rule processors
├── repositories/
│   └── pipeline.repository.ts          # Database operations
├── services/
│   ├── csv-parser.service.ts           # CSV parsing utilities
│   ├── pipeline-import.service.ts      # Import orchestration
│   ├── pipeline-job.service.ts         # Job lifecycle management
│   ├── pipeline-validation.service.ts  # Validation logic
│   ├── rule-engine.service.ts          # Rules processing engine
│   └── rule-processor.factory.ts       # Rule processor factory
├── pipeline.controller.ts              # HTTP endpoints
├── pipeline.service.ts                 # Main service
└── pipeline.module.ts                  # NestJS module
```

## Key Features

### ✅ Multi-Phase Processing
- Sequential processing through 6 defined phases
- Progress tracking and status reporting
- Error handling and recovery at each phase
- Configurable phase durations and timeouts

### ✅ Extensible Rules Engine
- 8 rule types: trim, regex_replace, exact_match, fuzzy_match, etc.
- Priority-based rule execution
- Confidence scoring system
- Rules can target specific fields or entire rows
- Supports multiple processing phases

### ✅ Job Management
- Job creation, tracking, and monitoring
- Status updates: pending, running, completed, failed
- Progress reporting with row counts and timing
- Error tracking and detailed logging

### ✅ Data Validation
- Schema validation against target data model
- Business rule validation
- Data quality checks
- Invalid row tracking and reporting

## API Endpoints

### Core Pipeline Operations
```bash
POST /api/pipeline/import           # Start new import job
GET  /api/pipeline/jobs             # List all jobs with status
GET  /api/pipeline/jobs/:id         # Get specific job details
GET  /api/pipeline/jobs/:id/status  # Get job status and progress
POST /api/pipeline/jobs/:id/cancel  # Cancel running job

GET  /api/pipeline/staged-data      # Preview processed data
POST /api/pipeline/test-rules       # Test rules against sample data
```

### Rules Management
```bash
GET    /api/pipeline/rules          # Get all rules
POST   /api/pipeline/rules          # Create new rule
PUT    /api/pipeline/rules/:id      # Update rule
DELETE /api/pipeline/rules/:id      # Delete rule
POST   /api/pipeline/rules/test     # Test rule against data
```

## Rule Types and Configuration

### Available Rule Types
```typescript
enum RuleType {
  TRIM = 'trim',                    // Remove whitespace
  REGEX_REPLACE = 'regex_replace',  // Pattern replacement
  EXACT_MATCH = 'exact_match',      // Exact string matching
  FUZZY_MATCH = 'fuzzy_match',      // Approximate matching
  DATE_FORMAT = 'date_format',      # Date standardization
  NUMBER_FORMAT = 'number_format',  # Number formatting
  CASE_TRANSFORM = 'case_transform', // Case conversion
  CUSTOM = 'custom'                 // Custom rule logic
}
```

### Rule Configuration Example
```typescript
const trimRule: CreateRuleDto = {
  name: 'Trim Whitespace',
  type: RuleType.TRIM,
  phase: PipelinePhase.CLEAN,
  target_field: 'asset_name',
  configuration: {
    sides: 'both' // 'left', 'right', 'both'
  },
  priority: 100,
  is_active: true
};
```

## Processing Flow

### 1. Extract Phase
- Parse CSV files using streaming parser
- Generate FileMetadata with basic statistics
- Create initial ProcessedRow objects
- Handle encoding and delimiter detection

### 2. Validate Phase
- Schema validation against target model
- Required field checks
- Data type validation
- Business rule validation

### 3. Clean Phase
- Apply cleaning rules in priority order
- Remove whitespace, normalize values
- Handle special characters and encoding
- Track cleaning operations applied

### 4. Transform Phase
- Apply transformation rules
- Data type conversions
- Format standardization
- Value mapping and substitution

### 5. Map Phase
- Map CSV columns to target schema fields
- Handle field renaming and restructuring
- Apply default values where needed
- Create final data structure

### 6. Load Phase
- Final validation before import
- Database transaction management
- Error handling and rollback
- Success confirmation and statistics

## Usage Examples

### Start Pipeline Job
```typescript
POST /api/pipeline/import
{
  "fileName": "assets_2025.csv",
  "mapping": {
    "Asset ID": "asset_tag",
    "Name": "name",
    "Building": "building"
  }
}
```

### Create Cleaning Rule
```typescript
POST /api/pipeline/rules
{
  "name": "Standardize Building Names",
  "type": "regex_replace",
  "phase": "CLEAN",
  "target_field": "building",
  "configuration": {
    "pattern": "Bldg\\s+(\\d+)",
    "replacement": "Building $1"
  },
  "priority": 50
}
```

### Test Rules
```typescript
POST /api/pipeline/test-rules
{
  "rules": [
    {
      "type": "trim",
      "target_field": "name",
      "configuration": { "sides": "both" }
    }
  ],
  "testData": {
    "name": "  Asset Name  ",
    "building": "Building 1"
  }
}
```

## Error Handling

### Phase-Level Errors
- Each phase can fail independently
- Errors logged with context and recovery options
- Failed jobs can be resumed from last successful phase

### Row-Level Errors
- Invalid rows tracked but don't stop processing
- Detailed error messages with field-level context
- Option to exclude invalid rows from final import

### Rule Processing Errors
- Rules that fail are skipped with warning
- Processing continues with remaining rules
- Error details logged for troubleshooting

## Monitoring and Logging

### Job Status Tracking
```typescript
interface JobStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  phase: PipelinePhase;
  progress: {
    totalRows: number;
    processedRows: number;
    validRows: number;
    invalidRows: number;
  };
  timing: {
    startTime: Date;
    endTime?: Date;
    phaseDurations: Record<PipelinePhase, number>;
  };
  errors: string[];
}
```

### Performance Metrics
- Processing time per phase
- Rows processed per second
- Memory usage during processing
- Rule application statistics

## Configuration

### Environment Variables
```bash
PIPELINE_MAX_CONCURRENT_JOBS=3      # Max simultaneous jobs
PIPELINE_TEMP_DIR=/tmp/pipeline     # Temporary file storage
PIPELINE_CHUNK_SIZE=1000            # Rows per processing chunk
PIPELINE_TIMEOUT_MINUTES=60         # Job timeout
```

### Phase Durations (Configurable)
```typescript
const PHASE_DURATIONS = {
  EXTRACT: 10,    // seconds
  VALIDATE: 5,
  CLEAN: 8,
  TRANSFORM: 12,
  MAP: 6,
  LOAD: 15
};
```

## Testing

### Unit Tests
```bash
npm test pipeline                    # All pipeline tests
npm test pipeline.service           # Service tests
npm test rule-engine                # Rules engine tests
```

### Integration Tests
```bash
npm run test:e2e pipeline           # End-to-end pipeline tests
```

## Common Tasks

### Add New Rule Type
1. Add to `RuleType` enum in `pipeline-types.ts`
2. Create processor in `processors/` directory
3. Update `rule-processor.factory.ts`
4. Add tests and documentation

### Add New Processing Phase
1. Create phase processor implementing `PhaseProcessorInterface`
2. Add to `PipelinePhase` enum
3. Update orchestrator to include new phase
4. Add phase duration configuration

### Debug Pipeline Issues
```bash
# Check job status
GET /api/pipeline/jobs/:id

# Review processing logs
GET /logs?correlationId=:jobId

# Test rules in isolation
POST /api/pipeline/test-rules
```

## Best Practices

### Rule Design
- Keep rules simple and focused on single operations
- Use appropriate priority values (0-1000)
- Test rules thoroughly before production deployment
- Document rule purpose and expected behavior

### Performance
- Process data in configurable chunks
- Use streaming for large files
- Implement proper memory management
- Monitor processing times and optimize bottlenecks

### Error Recovery
- Design rules to be idempotent
- Implement proper transaction handling
- Provide clear error messages for troubleshooting
- Allow partial processing and resume capabilities

## Integration Points

### Frontend Integration
- Real-time progress updates via WebSocket (planned)
- Rule management UI components
- Job monitoring dashboard
- Data preview and validation feedback

### External Systems
- File upload integration with Azure Blob Storage
- Export capabilities to various formats
- API integration for external data sources
- Notification system for job completion