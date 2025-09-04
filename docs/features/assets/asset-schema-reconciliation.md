# Asset Schema Reconciliation

## ✅ IMPLEMENTATION STATUS: COMPLETE
**Last Updated**: 2025-09-04  
**Status**: 100% IMPLEMENTED

### Implementation Summary
- ✅ **Database Schema**: 136 fields implemented in Prisma
- ✅ **API Endpoints**: Full CRUD with 130+ field responses
- ✅ **DTOs**: Complete validation and response DTOs
- ✅ **Swagger Docs**: Interactive API documentation available
- ✅ **Enums**: AssetStatus (7 values) + AssetCondition (7 values)
- ✅ **Field Coverage**: 100% of CSV requirements + enhancements

## Source Fields Analysis
Based on the CSV containing 100+ fields from multiple asset management systems, here's the proposed normalized schema:

## Complete Field Inventory from CSV

### Identification & Core Fields
- Asset ID
- USAssetID  
- Internal Asset ID
- USE Asset ID
- Owner ID
- Asset Name
- Asset Tag
- Serial Number / Serial
- Model Number / Model
- Manufacturer / Make
- Description
- Catalog Name
- Catalog Item ID

### CATEGORIZATION FIELDS (Multiple Levels!)
- **Trade** (appears twice - critical field)
- **Precon System**
- **Operations System**
- **Title** (appears twice)
- **Drawing Abbreviation**
- **Precon Tag**
- **System Type ID**
- **Asset Category** / **Asset Category Name**
- **Equip Name ID**
- **Sub System Type** (appears twice)
- **Sub System ID**
- **Sub System Class**
- **Sub System Classification**
- **Class ID**
- **System Category**
- **Asset Type**
- **Type**
- **ID** (generic type identifier)

### Location & Property Fields
- Customer Name
- Property Name
- Building Name
- Floor / Floor Name
- Area (appears twice)
- Room Number (appears twice)
- Asset Location
- Property Zone Served
- X Coordinate
- Y Coordinate

### Size & Capacity Fields
- Equipment Size
- Asset Size (Rounded up)
- Size
- Unit (appears twice - for different measurements)
- ID Unit
- Square Feet
- Quantity

### Technical Specifications
- Motor HP
- Estimated Operating Hours
- Weight
- Number of Circuits
- Supply Fan Motor Size
- Return Fan Motor Size
- Belt Size
- Belt Quantity
- Filter Type
- Filter Size  
- Filter Quantity
- Refrigerant
- Refrierant Default Description (typo in source)
- Refrigerant Description
- Refrigerant Quantity
- Rating Name
- Rating Value

### Dates & Service Life
- Date Installed / Install Date / Installation Date
- Manufactured Date
- Service Life (appears THREE times)
- Industry Service Life
- Expected Liftime (typo in source)
- Observed Remaining Life / Observed Remaining LIfe (typo)
- Estimated Replacement Date
- Warranty Expiration Date

### Financial & Vendor
- Cost
- Vendor
- Website
- Service ID

### Relationships
- Equip Served by (equipment dependencies)

### Status & Verification
- Status
- Verified

### Notes (Extensive!)
- Notes (appears twice)
- Note 1 Subject / Note 1
- Note 2 Subject / Note 2
- Note 3 Subject / Note 3
- Note 4 Subject / Note 4
- Note 5 Subject / Note 5
- Note 6 Subject / Note 6

### Legacy System Fields
- #brnch_id
- #clntsteeqpmnt_rn
- #clntsteeqpmnt_nme

## Proposed Comprehensive Asset Schema

### Core Identification
```typescript
// Primary identifiers
id: UUID (auto-generated)
assetTag: String (unique, required)
name: String (required)
serialNumber: String?
modelNumber: String?
manufacturer: String?
description: Text?
catalogName: String?
catalogItemId: String?
```

### Multi-Level Categorization System
```typescript
// This is the most complex part - multiple classification systems
trade: String? // Department/trade responsible
title: String? // Asset title/role

// System hierarchy
systemType: Enum? // Precon vs Operations
systemTypeId: String?
systemCategory: String?
systemName: String? // Maps to Precon System / Operations System

// Sub-system hierarchy  
subSystemType: String?
subSystemId: String?
subSystemClass: String?
subSystemClassification: String?
classId: String?

// Asset categorization
assetCategory: String? // or FK to AssetCategories
assetCategoryName: String?
assetType: String?
type: String? // Generic type field

// Equipment specific
equipNameId: String?
equipServedBy: String? // Equipment dependencies

// Drawing/documentation
drawingAbbreviation: String?
preconTag: String?
```

### Location (Comprehensive)
```typescript
// Customer/Property level
customerId: UUID? // FK to Customers
customerName: String?
propertyId: UUID? // FK to Properties  
propertyName: String?

// Building level
buildingId: UUID? // FK to Buildings
buildingName: String?

// Specific location
floor: String?
floorName: String?
area: String?
roomNumber: String?
assetLocation: String? // Free text location
propertyZoneServed: String? // Zone/area served

// Coordinates
locationX: Decimal?
locationY: Decimal?
```

### Size & Measurements
```typescript
// Multiple size fields with units
equipmentSize: String?
assetSizeRounded: String?
size: String?
unit: String? // Unit for size
idUnit: String? // Alternative unit field
squareFeet: Decimal?
quantity: Integer?
weight: Decimal?
weightUnit: String?
```

### Dates & Lifecycle
```typescript
// Installation & manufacturing
installDate: Date?
manufactureDate: Date?

// Service life (multiple perspectives)
serviceLifeYears: Integer? // Expected service life
industryServiceLifeYears: Integer? // Industry standard
expectedLifetimeYears: Integer? // Expected lifetime
observedRemainingLifeYears: Integer? // Current assessment
estimatedReplacementDate: Date?
warrantyExpirationDate: Date?
```

### Technical Specifications (Detailed)
```typescript
// Motor & mechanical
motorHP: Decimal?
estimatedOperatingHours: Integer?
numberOfCircuits: Integer?

// HVAC specific
supplyFanMotorSize: String?
returnFanMotorSize: String?
beltSize: String?
beltQuantity: Integer?

// Filters
filterType: String?
filterSize: String?
filterQuantity: Integer?

// Refrigerant
refrigerantType: String?
refrigerantDefaultDescription: String?
refrigerantDescription: String?
refrigerantQuantity: Decimal?
refrigerantUnit: String?

// Ratings
ratingName: String?
ratingValue: String?
```

### Financial & Vendor
```typescript
cost: Decimal?
vendorId: UUID? // FK to Vendors
vendorName: String?
vendorWebsite: String?
serviceId: String? // Service contract ID
```

### Status & Metadata
```typescript
status: Enum // Active, Inactive, Maintenance, etc.
isVerified: Boolean default false
ownerId: String? // Original owner reference
```

### Notes System (Structured)
```typescript
// General notes
notes: Text?

// Structured notes array (JSON)
structuredNotes: [
  {
    subject: String,
    content: Text,
    order: Integer // 1-6 based on source
  }
]
```

### Legacy References (JSON)
```typescript
legacyReferences: {
  branchId: String?,
  clientSiteEquipmentRn: String?,
  clientSiteEquipmentName: String?,
  internalAssetId: String?,
  usAssetId: String?,
  useAssetId: String?,
  ownerId: String?
}
```

### Audit Fields
```typescript
createdAt: DateTime
updatedAt: DateTime
createdById: UUID // FK to Users
updatedById: UUID? // FK to Users
```

## Key Design Decisions

### 1. Categorization Strategy
Given the MANY categorization fields, we should:
- **Keep them separate** initially to preserve data fidelity
- **Create a hierarchical category system** over time
- **Use enums** for known values (Trade, SystemType, AssetCategory)
- **Allow free text** during migration, then normalize

### 2. Location Strategy
- Support both **structured** (building/floor/room) and **unstructured** (free text) location
- Link to **Buildings** and **Properties** tables when possible
- Preserve original location strings for reference

### 3. Technical Specs Strategy
- **Individual fields** for common specs (motorHP, weight, etc.)
- **JSON field** for variable/rare specifications
- Allows queries on common fields while maintaining flexibility

### 4. Notes Strategy
- Keep general **notes** field
- Store structured notes (1-6) in **JSON array**
- Preserves subject/content pairing from source

## Migration Approach

### Phase 1: Import All Fields
- Create comprehensive schema with all fields
- Import data preserving original values
- No data loss during migration

### Phase 2: Normalize & Clean
- Identify duplicate/redundant data
- Create lookup tables for categories
- Standardize units and formats

### Phase 3: Optimize
- Move rare fields to JSON
- Create indexes on search fields
- Archive legacy references

## Recommended Indexes
```sql
CREATE INDEX idx_assets_asset_tag ON assets(asset_tag);
CREATE INDEX idx_assets_serial_number ON assets(serial_number);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_building_floor ON assets(building_id, floor);
CREATE INDEX idx_assets_category ON assets(asset_category);
CREATE INDEX idx_assets_trade ON assets(trade);
CREATE INDEX idx_assets_system_type ON assets(system_type);
CREATE INDEX idx_assets_install_date ON assets(install_date);
```

## Enums to Define

```typescript
enum AssetStatus {
  ACTIVE
  INACTIVE
  MAINTENANCE
  RETIRED
  DISPOSED
  LOST
  STOLEN
}

enum SystemType {
  PRECON
  OPERATIONS
}

enum Trade {
  ELECTRICAL
  MECHANICAL
  PLUMBING
  HVAC
  STRUCTURAL
  CIVIL
  // ... add based on actual data
}

enum AssetCategory {
  // To be determined from actual data analysis
}
```