-- Asset Column Aliases Seed Data
-- Maps Shaw.csv headers to Asset table fields

-- Core identification fields
INSERT INTO asset_column_aliases (asset_field, csv_alias, confidence, created_by) VALUES
('name', 'Asset Name', 1.0, 'system'),
('name', 'name', 1.0, 'system'),
('assetTag', 'ID', 1.0, 'system'),
('assetTag', 'Asset ID', 1.0, 'system'),
('description', 'Description', 1.0, 'system'),
('description', 'Title', 0.8, 'system'),

-- Category and type fields
('category', 'category', 1.0, 'system'),
('assetCategory', 'Asset Category Name', 1.0, 'system'),
('status', 'status', 1.0, 'system'),
('type', 'type', 1.0, 'system'),
('type', 'Type', 1.0, 'system'),

-- Manufacturer and model fields  
('manufacturer', 'manufacturer', 1.0, 'system'),
('modelNumber', 'model', 1.0, 'system'),
('serialNumber', 'Serial Number', 1.0, 'system'),

-- Location fields from Shaw.csv
('buildingName', 'Building Name', 1.0, 'system'),
('floorName', 'Floor Name', 1.0, 'system'),
('roomNumber', 'Room Number', 1.0, 'system'),
('area', 'Area', 1.0, 'system'),
('squareFeet', 'Square Feet', 1.0, 'system'),

-- Coordinate fields
('xCoordinate', 'X Coordinate', 1.0, 'system'),
('yCoordinate', 'Y Coordinate', 1.0, 'system'),

-- Date and lifecycle fields
('installDate', 'Installation Date', 1.0, 'system'),
('warrantyExpirationDate', 'Warranty Expiration Date', 1.0, 'system'),
('observedRemainingLife', 'Observed Remaining Life', 1.0, 'system'),
('serviceLife', 'Service Life', 1.0, 'system'),
('estimatedReplacementDate', 'Estimated Replacement Date', 1.0, 'system'),

-- Motor and mechanical fields specific to Shaw.csv
('motorHp', 'Motor Size', 0.9, 'system'),
('supplyFanMotorSize', 'Supply Fan Motor Size', 1.0, 'system'),
('returnFanMotorSize', 'Return Fan Motor Size', 1.0, 'system'),
('beltSize', 'Belt Size', 1.0, 'system'),
('beltQuantity', 'Belt Quantity', 1.0, 'system'),
('filterType', 'Filter Type', 1.0, 'system'),
('filterSize', 'Filter Size', 1.0, 'system'),
('filterQuantity', 'Filter Quantity', 1.0, 'system'),

-- Cost and catalog fields
('purchaseCost', 'Cost', 1.0, 'system'),
('vendor', 'Catalog Name', 0.8, 'system'),
('vendorWebsite', 'Website', 1.0, 'system'),
('quantity', 'Quantity', 1.0, 'system'),

-- Status and verification
('verified', 'Verified', 1.0, 'system'),

-- Additional common variations
('assetTag', 'Asset Tag', 1.0, 'system'),
('name', 'Equipment Name', 0.9, 'system'),
('buildingName', 'Building', 0.9, 'system'),
('floor', 'Floor', 1.0, 'system'),
('roomNumber', 'Room', 0.9, 'system'),
('condition', 'Condition', 1.0, 'system'),
('purchaseDate', 'Purchase Date', 1.0, 'system'),
('modelNumber', 'Model Number', 1.0, 'system'),
('assetLocation', 'Location', 0.8, 'system');

-- Show results
SELECT 'Asset Column Aliases Created: ' || COUNT(*) AS summary FROM asset_column_aliases;