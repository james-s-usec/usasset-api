import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { AssetStatus } from '@prisma/client';

/**
 * Safe asset response DTO with all comprehensive fields exposed
 * Excludes only sensitive audit fields (is_deleted)
 */
export class SafeAssetDto {
  @ApiProperty({ description: 'Asset unique identifier' })
  @Expose()
  public id!: string;

  @ApiProperty({ description: 'Asset tag identifier' })
  @Expose()
  public assetTag!: string;

  @ApiProperty({ description: 'Asset name' })
  @Expose()
  public name!: string;

  @ApiPropertyOptional({ description: 'Asset manufacturer' })
  @Expose()
  public manufacturer?: string;

  @ApiPropertyOptional({ description: 'Asset model number' })
  @Expose()
  public modelNumber?: string;

  @ApiPropertyOptional({ description: 'Asset serial number' })
  @Expose()
  public serialNumber?: string;

  @ApiPropertyOptional({ description: 'Asset status', enum: AssetStatus })
  @Expose()
  public status?: AssetStatus;

  @ApiPropertyOptional({ description: 'Asset location' })
  @Expose()
  public location?: string;

  @ApiPropertyOptional({ description: 'Project ID this asset belongs to' })
  @Expose()
  public projectId?: string;

  // Enhanced identification
  @ApiPropertyOptional({ description: 'Asset description' })
  @Expose()
  public description?: string;

  @ApiPropertyOptional({ description: 'Catalog name' })
  @Expose()
  public catalogName?: string;

  @ApiPropertyOptional({ description: 'Catalog item ID' })
  @Expose()
  public catalogItemId?: string;

  // Categorization fields
  @ApiPropertyOptional({ description: 'Trade/Department responsible' })
  @Expose()
  public trade?: string;

  @ApiPropertyOptional({ description: 'Asset title/role' })
  @Expose()
  public title?: string;

  @ApiPropertyOptional({ description: 'Preconstruction system' })
  @Expose()
  public preconSystem?: string;

  @ApiPropertyOptional({ description: 'Operations system' })
  @Expose()
  public operationsSystem?: string;

  @ApiPropertyOptional({ description: 'Drawing abbreviation' })
  @Expose()
  public drawingAbbreviation?: string;

  @ApiPropertyOptional({ description: 'Preconstruction tag' })
  @Expose()
  public preconTag?: string;

  @ApiPropertyOptional({ description: 'System type ID' })
  @Expose()
  public systemTypeId?: string;

  @ApiPropertyOptional({ description: 'System category' })
  @Expose()
  public systemCategory?: string;

  @ApiPropertyOptional({ description: 'Asset category' })
  @Expose()
  public assetCategory?: string;

  @ApiPropertyOptional({ description: 'Asset category name' })
  @Expose()
  public assetCategoryName?: string;

  @ApiPropertyOptional({ description: 'Asset type' })
  @Expose()
  public assetType?: string;

  @ApiPropertyOptional({ description: 'Generic type' })
  @Expose()
  public type?: string;

  @ApiPropertyOptional({ description: 'Equipment name ID' })
  @Expose()
  public equipNameId?: string;

  @ApiPropertyOptional({ description: 'Sub system type' })
  @Expose()
  public subSystemType?: string;

  @ApiPropertyOptional({ description: 'Sub system ID' })
  @Expose()
  public subSystemId?: string;

  @ApiPropertyOptional({ description: 'Sub system class' })
  @Expose()
  public subSystemClass?: string;

  @ApiPropertyOptional({ description: 'Sub system classification' })
  @Expose()
  public subSystemClassification?: string;

  @ApiPropertyOptional({ description: 'Class ID' })
  @Expose()
  public classId?: string;

  @ApiPropertyOptional({ description: 'Equipment served by' })
  @Expose()
  public equipServedBy?: string;

  // Location fields
  @ApiPropertyOptional({ description: 'Customer name' })
  @Expose()
  public customerName?: string;

  @ApiPropertyOptional({ description: 'Property name' })
  @Expose()
  public propertyName?: string;

  @ApiPropertyOptional({ description: 'Building name' })
  @Expose()
  public buildingName?: string;

  @ApiPropertyOptional({ description: 'Floor' })
  @Expose()
  public floor?: string;

  @ApiPropertyOptional({ description: 'Floor name' })
  @Expose()
  public floorName?: string;

  @ApiPropertyOptional({ description: 'Area' })
  @Expose()
  public area?: string;

  @ApiPropertyOptional({ description: 'Room number' })
  @Expose()
  public roomNumber?: string;

  @ApiPropertyOptional({ description: 'Asset location description' })
  @Expose()
  public assetLocation?: string;

  @ApiPropertyOptional({ description: 'Property zone served' })
  @Expose()
  public propertyZoneServed?: string;

  @ApiPropertyOptional({ description: 'X coordinate', type: 'number' })
  @Expose()
  public xCoordinate?: number;

  @ApiPropertyOptional({ description: 'Y coordinate', type: 'number' })
  @Expose()
  public yCoordinate?: number;

  // TCO & Cost fields
  @ApiPropertyOptional({ description: 'Initial purchase cost', type: 'number' })
  @Expose()
  public purchaseCost?: number;

  @ApiPropertyOptional({ description: 'Installation cost', type: 'number' })
  @Expose()
  public installationCost?: number;

  @ApiPropertyOptional({ description: 'Annual maintenance cost', type: 'number' })
  @Expose()
  public annualMaintenanceCost?: number;

  @ApiPropertyOptional({ description: 'Estimated annual operating cost', type: 'number' })
  @Expose()
  public estimatedAnnualOperatingCost?: number;

  @ApiPropertyOptional({ description: 'Expected disposal cost', type: 'number' })
  @Expose()
  public disposalCost?: number;

  @ApiPropertyOptional({ description: 'Expected salvage value', type: 'number' })
  @Expose()
  public salvageValue?: number;

  @ApiPropertyOptional({ description: 'Calculated TCO', type: 'number' })
  @Expose()
  public totalCostOfOwnership?: number;

  @ApiPropertyOptional({ description: 'Depreciation method' })
  @Expose()
  public depreciationMethod?: string;

  @ApiPropertyOptional({ description: 'Current book value', type: 'number' })
  @Expose()
  public currentBookValue?: number;

  // Energy fields
  @ApiPropertyOptional({ description: 'Rated power in kilowatts', type: 'number' })
  @Expose()
  public ratedPowerKw?: number;

  @ApiPropertyOptional({ description: 'Actual measured power in kilowatts', type: 'number' })
  @Expose()
  public actualPowerKw?: number;

  @ApiPropertyOptional({ description: 'Average daily operating hours', type: 'number' })
  @Expose()
  public dailyOperatingHours?: number;

  @ApiPropertyOptional({ description: 'Estimated annual kWh consumption', type: 'number' })
  @Expose()
  public estimatedAnnualKwh?: number;

  @ApiPropertyOptional({ description: 'Voltage', type: 'integer' })
  @Expose()
  public voltage?: number;

  @ApiPropertyOptional({ description: 'BTU rating', type: 'integer' })
  @Expose()
  public btuRating?: number;

  // Lifecycle dates
  @ApiPropertyOptional({ description: 'Installation date' })
  @Expose()
  public installDate?: Date;

  @ApiPropertyOptional({ description: 'Manufacture date' })
  @Expose()
  public manufactureDate?: Date;

  @ApiPropertyOptional({ description: 'Service life in years', type: 'integer' })
  @Expose()
  public serviceLife?: number;

  @ApiPropertyOptional({ description: 'Expected lifetime in years', type: 'integer' })
  @Expose()
  public expectedLifetime?: number;

  // Size & measurement
  @ApiPropertyOptional({ description: 'Equipment size' })
  @Expose()
  public equipmentSize?: string;

  @ApiPropertyOptional({ description: 'Size' })
  @Expose()
  public size?: string;

  @ApiPropertyOptional({ description: 'Unit of measurement' })
  @Expose()
  public unit?: string;

  @ApiPropertyOptional({ description: 'Quantity', type: 'integer' })
  @Expose()
  public quantity?: number;

  @ApiPropertyOptional({ description: 'Square feet', type: 'number' })
  @Expose()
  public squareFeet?: number;

  @ApiPropertyOptional({ description: 'Weight', type: 'number' })
  @Expose()
  public weight?: number;

  // Vendor & service
  @ApiPropertyOptional({ description: 'Vendor name' })
  @Expose()
  public vendor?: string;

  @ApiPropertyOptional({ description: 'Vendor website' })
  @Expose()
  public vendorWebsite?: string;

  @ApiPropertyOptional({ description: 'Service contract ID' })
  @Expose()
  public serviceId?: string;

  // Status & metadata
  @ApiPropertyOptional({ description: 'Data verified flag', type: 'boolean' })
  @Expose()
  public verified?: boolean;

  @ApiPropertyOptional({ description: 'Owner ID' })
  @Expose()
  public ownerId?: string;

  // Notes
  @ApiPropertyOptional({ description: 'General notes' })
  @Expose()
  public notes?: string;

  // Timestamps
  @ApiProperty({ description: 'Asset creation timestamp' })
  @Expose()
  public created_at!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  public updated_at!: Date;

  // Explicitly excluded: is_deleted and other sensitive audit fields
}
