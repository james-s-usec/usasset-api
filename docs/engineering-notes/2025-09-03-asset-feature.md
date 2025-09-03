# Engineering Notes - 2025-09-03

## Morning Standup
- **Yesterday**: CI/CD debugging and memory optimization
- **Today**: Asset Feature architecture and planning
- **Blockers**: None

## Work Log

### 08:54 - CI/CD Memory Debugging #problem #solution
**What**: Diagnosed and fixed npm run ci freezing issues
**Why**: CI pipeline was causing VS Code and Docker to freeze
**How**: Created debug-ci.sh script for sequential execution with memory monitoring
**Result**: Identified memory exhaustion (1.9GB limit with Jest parallel execution)
**Solution**: Increased WSL2 memory from 1.9GB to 8GB in .wslconfig
**Learned**: 
- Jest parallel tests can consume massive memory
- WSL2 default memory (2GB) insufficient for modern dev
- Sequential execution as fallback strategy

### 09:15 - Asset Feature Architecture Planning #decision
**What**: Designed comprehensive Asset Management feature
**Why**: Core requirement for USAsset application - tracking 130+ asset fields
**How**: Created asset-feature-guide.xml with complete schema and roadmap
**Result**: 
- Flattened table design (single denormalized table)
- Only 3 required fields (id, assetTag, name) for flexibility
- 130+ optional fields organized by category
**Decisions Made**:
- **Flat table over normalized**: Simplicity > perfect normalization for MVP
- **Minimal required fields**: Allow dirty data import, clean later
- **Energy rates at Project level**: Avoid duplication, single source of truth

### 09:45 - Tracer Bullet Implementation Strategy #decision
**What**: Defined tracer bullet approach for Asset feature
**Why**: Need working end-to-end slice quickly before building full feature
**How**: 
1. Start with 3 fields only (id, assetTag, name)
2. Get data from database → API → UI
3. Incrementally add field bundles
**Result**: Clear implementation path with working software at each step
**Trade-offs**: 
- Giving up completeness for immediate functionality
- Multiple migrations vs single large migration

### 10:00 - Created Claude Code Slash Command
**What**: Built /asset-status command for development tracking
**Why**: Need consistent way to track progress across sessions
**How**: Created .claude/commands/asset-status.md with references to master guide
**Result**: Single command to check implementation status and get next steps
**Location**: `/home/swansonj/projects/USAsset3/.claude/commands/asset-status.md`

## Decisions Made

### 1. Asset Schema Design #decision
**Decision**: Flattened single table with 130+ fields
**Context**: Multiple legacy systems being consolidated
**Options Considered**:
- Normalized with 10+ related tables
- JSON fields for variable data
- Hybrid approach
**Rationale**: Simplicity and import flexibility outweigh normalization benefits for MVP
**Trade-offs**: Larger table, potential nulls, but much simpler queries

### 2. Energy Rate Storage #decision  
**Decision**: Store energy rates at Project level, not Asset level
**Context**: All assets in a facility share same utility rates
**Rationale**:
- Single source of truth for rates
- Easy to update rates project-wide
- Avoid data duplication
**Implementation**: Assets store consumption, Projects store rates, calculate costs dynamically

### 3. TCO Field Structure #decision
**Decision**: Add comprehensive TCO fields to both Assets and Projects
**Fields Added**:
- Asset: purchaseCost, installationCost, annualMaintenanceCost
- Project: totalFirstCost, totalReplacementValue, totalCostOfOwnership
**Rationale**: Essential for asset management ROI calculations

## Code Organization

### Documentation Structure
```
docs/
├── features/
│   └── assets/
│       └── asset-feature-guide.xml  # Master reference (130+ fields, roadmap)
├── daynotes/
│   └── 2025-09-03.md               # This file
└── CI_DEBUG_LOG.md                 # CI troubleshooting documentation
```

### Command Structure  
```
.claude/
└── commands/
    └── asset-status.md              # /asset-status slash command
```

## Learning Notes

### TIL: Claude Code Slash Commands
- Markdown files in `.claude/commands/` become slash commands
- Can reference project documentation
- Support arguments like `/asset-status tracer`
- Auto-discovered, no installation needed

### TIL: WSL2 Memory Management
- Default allocation often insufficient (2GB)
- Configure via `.wslconfig` in Windows user directory
- Requires `wsl --shutdown` to apply changes
- Can allocate up to host system limits

### Tool Discovered: debug-ci.sh
- Sequential execution with memory monitoring
- Colored output for readability
- Timeout protection per command
- Detailed logging to `.logs/debug-ci-*.log`

## Tomorrow's Priority
1. **Start Asset tracer bullet** - Get 3-field version working end-to-end
2. **Fix remaining lint errors** - 5 backend, 5 frontend errors blocking CI
3. **Add first field bundle** - Status field and project relationship

## Key Metrics
- **CI Performance**: 45 seconds (was freezing/timeout)
- **Memory Usage**: 2.1GB peak (was hitting 1.9GB limit)
- **Asset Fields Defined**: 130+ fields across 12 categories
- **Implementation Timeline**: 8-week roadmap created

## Tags
#decision #problem #solution #learned #architecture #asset-feature #ci-optimization