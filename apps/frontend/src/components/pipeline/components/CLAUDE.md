# Pipeline Components Documentation

## Field Mappings System

### FieldMappingsTable Component

**Purpose**: Manages CSV header to asset field mappings for ETL pipeline processing.

#### Key Behaviors

**Table Display Logic**:
- **Main table shows ONLY asset fields that have existing CSV aliases** 
- Empty/unmapped fields are NOT displayed in the table
- To see all 129 available asset fields, use the "Add Mapping" button dropdown

**Available Asset Fields**: 
- Complete list of 129 fields extracted from `SafeAssetDto` 
- Includes: core fields, energy data, financial data, technical specs, notes, legacy fields
- Sorted alphabetically for easy selection

**User Workflow**:
1. Click "Add Mapping" button
2. Select from dropdown of 129 asset fields  
3. Enter CSV header alias
4. Save mapping
5. Field now appears in main table with its aliases

**One-to-Many Relationship**:
- Each asset field can have multiple CSV header aliases
- Handles typos, variations, different naming conventions
- Display as chips with delete functionality

#### Component Structure

```
FieldMappingsTable
├── Management Mode (no selectedFile)
│   ├── ManagementViewHeader (Add Mapping button)
│   ├── ManagementTable (shows only mapped fields)
│   └── CreateAliasDialog (dropdown with all 129 fields)
└── Pipeline Mode (with selectedFile) 
    └── FieldMappingsTableContent (file-specific mappings)
```

#### Technical Implementation

**ASSET_FIELDS Array**:
- 129 fields extracted from backend SafeAssetDto
- Generated via: `grep -E "^\s*public [a-zA-Z_]" SafeAssetDto | sed ...`
- Sorted alphabetically for consistent UI

**API Integration**:
- `getAllAliases()` - Fetch existing mappings
- `createAlias()` - Create new mapping  
- `deleteAlias()` - Remove mapping
- Uses standardized `apiService` for consistent error handling

**Performance Optimizations**:
- `useCallback` for memoized functions to prevent re-renders
- Proper React hook dependencies to avoid infinite API calls
- Component decomposition to satisfy ESLint rules

#### Important Notes

⚠️ **Table Filtering**: The main table is filtered to show only asset fields with existing aliases. This is intentional UX design to avoid displaying 129 empty rows.

✅ **Complete Field Access**: All 129 fields are accessible via the "Add Mapping" dialog dropdown.

🔧 **Future Enhancement**: Could add toggle to "Show All Fields" vs "Show Only Mapped Fields" if needed.