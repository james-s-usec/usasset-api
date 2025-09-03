---
description: Check Asset Feature implementation status and get next steps
argument-hint: [optional: tracer|fields|test|next|help]
---

# Asset Feature Status & Development Tracker

## 📍 MASTER REFERENCE DOCUMENT
**ALWAYS READ THIS FIRST**: `docs/features/assets/asset-feature-guide.xml`

This XML file contains:
- Complete schema with 130+ fields (look for `<asset-schema>` section)
- Tracer bullet implementation (look for `<tracer-bullet>` section)
- 8-week roadmap with milestones (look for `<phase-3-complete-roadmap>` section)
- Project energy/cost fields to add (look for `<project-schema-updates>` section)
- All implementation steps and code snippets

## How to Use This Command

When user says `/asset-status [argument]`, you should:

1. **FIRST**: Read the `docs/features/assets/asset-feature-guide.xml` file
2. **FIND**: The relevant section based on the argument
3. **CHECK**: Current implementation state (see commands below)
4. **PROVIDE**: Specific next steps from the guide

## Check Current Implementation State

### 1. Database Status
```bash
# Check if Asset model exists in schema
cd apps/backend
grep -A 10 "model Asset" prisma/schema.prisma || echo "No Asset model found"

# Count how many fields are implemented
grep -c "^\s*\w*" prisma/schema.prisma | grep -A 50 "model Asset"
```

### 2. Backend Module Status  
```bash
# Check if assets module exists
ls -la apps/backend/src/assets/ 2>/dev/null || echo "Asset module not created"

# Check what endpoints exist
grep "@Get\|@Post\|@Put\|@Delete" apps/backend/src/assets/controllers/*.ts 2>/dev/null
```

### 3. Frontend Status
```bash
# Check if asset components exist
ls -la apps/frontend/src/pages/*asset* 2>/dev/null
ls -la apps/frontend/src/services/*asset* 2>/dev/null
```

## Command Arguments & Actions

### `/asset-status` or `/asset-status status`
1. **Read**: `docs/features/assets/asset-feature-guide.xml` 
2. **Find**: Current phase by checking implementation
3. **Reference**: 
   - If no Asset model → Show `<tracer-bullet>` → `<step-1-database>`
   - If basic model (3 fields) → Show `<tracer-bullet>` → `<step-2-backend>`
   - If 10+ fields → Show `<phase-3-complete-roadmap>` → `<milestone-1>`
   - If 30+ fields → Show `<phase-3-complete-roadmap>` → `<milestone-2>` 
4. **Display**: Progress checklist from the relevant section

### `/asset-status tracer`
1. **Read**: `docs/features/assets/asset-feature-guide.xml`
2. **Go to**: `<tracer-bullet>` section
3. **Find**: `<phase-1-minimal-slice>`
4. **Show**: All 4 steps with exact code from:
   - `<step-1-database>` - Schema with 3 fields
   - `<step-2-backend>` - Service and controller code
   - `<step-3-test-api>` - Curl commands
   - `<step-4-frontend>` - React component code

### `/asset-status fields`
1. **Read**: `docs/features/assets/asset-feature-guide.xml`
2. **Go to**: `<asset-schema>` section
3. **List**: Fields by category:
   - `<identification-fields>` (9 fields)
   - `<categorization-fields>` (19 fields!)
   - `<location-fields>` (12 fields)
   - `<measurement-fields>` (8 fields)
   - `<lifecycle-fields>` (8 fields)
   - `<technical-fields>` (17 fields)
   - `<tco-cost-fields>` (9 fields)
   - `<energy-fields>` (15 fields)
   - `<energy-cost-fields>` (7 fields)
   - And more...

### `/asset-status next`
1. **Read**: `docs/features/assets/asset-feature-guide.xml`
2. **Determine**: Current implementation level
3. **Find**: Next increment from either:
   - `<tracer-bullet>` → `<phase-2-incremental>` → `<increment-1>` through `<increment-5>`
   - `<phase-3-complete-roadmap>` → `<milestone-1>` through `<milestone-8>`
4. **Show**: Exact next task with code/commands

### `/asset-status test`
1. **Check**: What's implemented
2. **Generate**: Test commands based on current phase
3. **Include**: Both API tests and database checks

### `/asset-status help`
Show this command guide and reference locations in the XML

## Implementation Phases (from asset-feature-guide.xml)

### 🎯 Tracer Bullet Phase
**Location**: `<tracer-bullet>` section
- 2 hours to working end-to-end
- Just 3 fields (id, assetTag, name)
- Minimal API and UI

### 📈 Incremental Additions
**Location**: `<phase-2-incremental>` section
- Increment 1: Add status field
- Increment 2: Add project relationship
- Increment 3: Add purchase cost
- Increment 4: Add location fields
- Increment 5: Add energy fields subset

### 🗓️ Full Roadmap (8 weeks)
**Location**: `<phase-3-complete-roadmap>` section  
- Milestone 1: Core Fields & CRUD
- Milestone 2: Relationships & Categories
- Milestone 3: Location & Organization
- Milestone 4: Financial Fields
- Milestone 5: Technical Specifications
- Milestone 6: Bulk Operations
- Milestone 7: Polish & Performance
- Milestone 8: Data Import ETL

## Project Updates Needed
**Location**: `<project-schema-updates>` section
Don't forget to add energy rates and cost fields to the Project model!

## Always Reference the Master Guide!
The `docs/features/assets/asset-feature-guide.xml` file is the single source of truth. 
Every code snippet, field definition, and implementation step is documented there.