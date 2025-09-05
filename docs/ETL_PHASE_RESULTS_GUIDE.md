# ETL Phase Results Viewing & Export Guide

## Overview
This guide shows you how to view and download detailed logs from ETL (Extract, Transform, Load) pipeline processing. Every intermediate step, transformation, and applied rule is tracked and can be exported for analysis.

## API Endpoints

### View Phase Results (JSON Response)
```
GET /api/pipeline/jobs/{jobId}/phase-results
```

### Download Phase Results (File Download)
```
GET /api/pipeline/jobs/{jobId}/phase-results/download
```

## Usage Examples

### 1. View ETL Logs in Terminal
```bash
# Get detailed phase results for a specific job
curl http://localhost:3000/api/pipeline/jobs/{jobId}/phase-results

# Pretty print with jq
curl http://localhost:3000/api/pipeline/jobs/{jobId}/phase-results | jq '.'

# View just the summary
curl http://localhost:3000/api/pipeline/jobs/{jobId}/phase-results | jq '.summary'
```

### 2. Download Complete ETL Logs
```bash
# Download complete phase results as JSON file
curl -O http://localhost:3000/api/pipeline/jobs/{jobId}/phase-results/download

# This automatically downloads: "etl-phase-results-{jobId}-YYYY-MM-DD.json"
```

### 3. Browser Download (Click & Download)
Simply visit in your browser:
```
http://localhost:3000/api/pipeline/jobs/{jobId}/phase-results/download
```
Your browser will automatically download the file with all ETL intermediate steps.

## Response Format

### JSON Response Structure
```json
{
  "jobId": "job-123",
  "phaseResults": [
    {
      "phase": "EXTRACT",
      "status": "SUCCESS",
      "transformations": [
        {
          "field": "name",
          "before": " Asset 1 ",
          "after": "Asset 1",
          "ruleApplied": "trim"
        }
      ],
      "appliedRules": ["trim", "regex_replace"],
      "inputSample": [/* first 5 rows before processing */],
      "outputSample": [/* first 5 rows after processing */],
      "metrics": {
        "rowsProcessed": 100,
        "rowsModified": 45,
        "rowsFailed": 2
      },
      "timing": {
        "startedAt": "2025-01-05T12:30:00Z",
        "completedAt": "2025-01-05T12:30:01Z",
        "durationMs": 1200
      },
      "metadata": {
        "rulesEngineVersion": "1.0",
        "confidence": 0.92
      },
      "errors": ["Row 45: Invalid date format"],
      "warnings": ["Row 12: Unusual value detected"]
    }
    // ... more phases: VALIDATE, CLEAN, TRANSFORM, MAP, LOAD
  ],
  "summary": {
    "totalPhases": 6,
    "successfulPhases": 5,
    "failedPhases": 1,
    "totalDuration": 15400
  }
}
```

### Downloaded File Structure
The downloaded file includes additional download metadata:
```json
{
  "downloadInfo": {
    "jobId": "job-123",
    "downloadedAt": "2025-01-05T23:45:30Z",
    "fileName": "etl-phase-results-job-123-2025-01-05.json"
  },
  "jobId": "job-123",
  "phaseResults": [ /* same as above */ ],
  "summary": { /* same as above */ }
}
```

## ETL Phases Tracked

The system logs details for all 6 ETL phases:

1. **EXTRACT** - Parse and load CSV data
2. **VALIDATE** - Check data integrity and business rules  
3. **CLEAN** - Apply cleaning rules (trim, normalize)
4. **TRANSFORM** - Apply transformation rules (format, convert)
5. **MAP** - Map fields to target schema
6. **LOAD** - Import to final destination

## Data Tracked Per Phase

### Transformations
Exact before/after changes for each field:
```json
{
  "field": "building",
  "before": "Bldg 1", 
  "after": "Building 1",
  "ruleApplied": "building_standardizer"
}
```

### Applied Rules
List of all rules executed during the phase:
```json
["trim", "building_standardizer", "case_normalize"]
```

### Metrics
Processing statistics:
```json
{
  "rowsProcessed": 1000,
  "rowsModified": 342, 
  "rowsFailed": 15
}
```

### Timing
Performance data:
```json
{
  "startedAt": "2025-01-05T12:30:00Z",
  "completedAt": "2025-01-05T12:30:01Z", 
  "durationMs": 1200
}
```

### Errors & Warnings
Detailed issue tracking:
```json
{
  "errors": ["Row 45: Invalid date format", "Row 67: Missing required field"],
  "warnings": ["Row 12: Unusual value detected"]
}
```

## Advanced Usage

### Filter Specific Phases
```bash
# View only the CLEAN phase results
curl http://localhost:3000/api/pipeline/jobs/{jobId}/phase-results | \
  jq '.phaseResults[] | select(.phase == "CLEAN")'

# View only failed phases
curl http://localhost:3000/api/pipeline/jobs/{jobId}/phase-results | \
  jq '.phaseResults[] | select(.status == "FAILED")'
```

### Extract Performance Data
```bash
# Get timing for all phases
curl http://localhost:3000/api/pipeline/jobs/{jobId}/phase-results | \
  jq '.phaseResults[] | {phase, durationMs: .timing.durationMs}'

# Find slowest phase
curl http://localhost:3000/api/pipeline/jobs/{jobId}/phase-results | \
  jq '.phaseResults | sort_by(.timing.durationMs) | reverse | .[0] | {phase, durationMs: .timing.durationMs}'
```

### Analyze Transformations
```bash
# Count total transformations across all phases
curl http://localhost:3000/api/pipeline/jobs/{jobId}/phase-results | \
  jq '[.phaseResults[].transformations | length] | add'

# List all rules that were applied
curl http://localhost:3000/api/pipeline/jobs/{jobId}/phase-results | \
  jq '[.phaseResults[].appliedRules[]] | unique'
```

## Integration with Frontend

### JavaScript/TypeScript Usage
```typescript
// Fetch phase results
const response = await fetch(`/api/pipeline/jobs/${jobId}/phase-results`);
const phaseResults = await response.json();

// Download file programmatically
const downloadResponse = await fetch(`/api/pipeline/jobs/${jobId}/phase-results/download`);
const blob = await downloadResponse.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `etl-results-${jobId}.json`;
a.click();
```

## Error Handling

### Common Response Codes
- **200**: Success - phase results retrieved
- **404**: Job ID not found
- **500**: Server error retrieving phase results

### Error Response Format
```json
{
  "statusCode": 404,
  "message": "Job with ID 'invalid-job-id' not found",
  "error": "Not Found"
}
```

## File Naming Convention

Downloaded files follow this pattern:
```
etl-phase-results-{jobId}-{YYYY-MM-DD}.json
```

Examples:
- `etl-phase-results-job-abc123-2025-01-05.json`
- `etl-phase-results-import-456789-2025-01-05.json`

## Best Practices

### For Debugging
1. **Start with the summary** to understand overall job success/failure
2. **Check failed phases first** to identify critical issues
3. **Review transformations** to verify data changes are correct
4. **Analyze timing** to identify performance bottlenecks

### For Auditing
1. **Download complete logs** for permanent record keeping
2. **Track applied rules** to ensure compliance with business rules
3. **Monitor error patterns** to identify data quality issues
4. **Review warnings** for potential data anomalies

### For Performance Analysis
1. **Compare phase durations** across different jobs
2. **Monitor transformation counts** to understand processing complexity
3. **Track failure rates** by phase to identify system bottlenecks
4. **Analyze rule execution patterns** for optimization opportunities

## Troubleshooting

### Job ID Not Found
- Verify the job ID exists: `GET /api/pipeline/jobs`
- Check if the job has completed processing
- Ensure phase results were logged during processing

### Empty Results
- Job may not have completed all phases
- Phase logging may not be enabled
- Check job status first: `GET /api/pipeline/status/{jobId}`

### Large File Downloads
- Phase results can be large for big datasets
- Consider using the JSON endpoint for programmatic access
- Use jq or similar tools to filter large responses