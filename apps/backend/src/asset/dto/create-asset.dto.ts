import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetStatus, AssetCondition } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateAssetDto {
  @ApiProperty({
    description: 'Asset tag identifier',
    example: 'ASSET-001',
  })
  @IsString()
  @IsNotEmpty()
  public assetTag!: string;

  @ApiProperty({
    description: 'Asset name',
    example: 'Dell Laptop',
  })
  @IsString()
  @IsNotEmpty()
  public name!: string;

  @ApiPropertyOptional({
    description: 'Asset manufacturer',
    example: 'Dell Inc.',
  })
  @IsString()
  @IsOptional()
  public manufacturer?: string;

  @ApiPropertyOptional({
    description: 'Asset model number',
    example: 'Latitude 7520',
  })
  @IsString()
  @IsOptional()
  public modelNumber?: string;

  @ApiPropertyOptional({
    description: 'Asset serial number',
    example: 'SN123456789',
  })
  @IsString()
  @IsOptional()
  public serialNumber?: string;

  @ApiPropertyOptional({
    description: 'Asset status',
    enum: AssetStatus,
    default: AssetStatus.ACTIVE,
  })
  @IsEnum(AssetStatus)
  @IsOptional()
  public status?: AssetStatus;

  @ApiPropertyOptional({
    description: 'Asset condition',
    enum: AssetCondition,
    default: AssetCondition.GOOD,
  })
  @IsEnum(AssetCondition)
  @IsOptional()
  public condition?: AssetCondition;

  @ApiPropertyOptional({
    description: 'Asset location',
    example: 'Office Building A, Floor 2',
  })
  @IsString()
  @IsOptional()
  public location?: string;

  @ApiPropertyOptional({
    description: 'Project ID this asset belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  public projectId?: string;

  // Enhanced identification
  @ApiPropertyOptional({ description: 'Asset description' })
  @IsString()
  @IsOptional()
  public description?: string;

  @ApiPropertyOptional({ description: 'Catalog name' })
  @IsString()
  @IsOptional()
  public catalogName?: string;

  @ApiPropertyOptional({ description: 'Catalog item ID' })
  @IsString()
  @IsOptional()
  public catalogItemId?: string;

  // Categorization fields
  @ApiPropertyOptional({ description: 'Trade/Department responsible' })
  @IsString()
  @IsOptional()
  public trade?: string;

  @ApiPropertyOptional({ description: 'Asset title/role' })
  @IsString()
  @IsOptional()
  public title?: string;

  @ApiPropertyOptional({ description: 'Preconstruction system' })
  @IsString()
  @IsOptional()
  public preconSystem?: string;

  @ApiPropertyOptional({ description: 'Operations system' })
  @IsString()
  @IsOptional()
  public operationsSystem?: string;

  @ApiPropertyOptional({ description: 'Drawing abbreviation' })
  @IsString()
  @IsOptional()
  public drawingAbbreviation?: string;

  @ApiPropertyOptional({ description: 'Preconstruction tag' })
  @IsString()
  @IsOptional()
  public preconTag?: string;

  @ApiPropertyOptional({ description: 'System type ID' })
  @IsString()
  @IsOptional()
  public systemTypeId?: string;

  @ApiPropertyOptional({ description: 'System category' })
  @IsString()
  @IsOptional()
  public systemCategory?: string;

  @ApiPropertyOptional({ description: 'Asset category' })
  @IsString()
  @IsOptional()
  public assetCategory?: string;

  @ApiPropertyOptional({ description: 'Asset category name' })
  @IsString()
  @IsOptional()
  public assetCategoryName?: string;

  @ApiPropertyOptional({ description: 'Asset type' })
  @IsString()
  @IsOptional()
  public assetType?: string;

  @ApiPropertyOptional({ description: 'Generic type' })
  @IsString()
  @IsOptional()
  public type?: string;

  @ApiPropertyOptional({ description: 'Equipment name ID' })
  @IsString()
  @IsOptional()
  public equipNameId?: string;

  @ApiPropertyOptional({ description: 'Sub system type' })
  @IsString()
  @IsOptional()
  public subSystemType?: string;

  @ApiPropertyOptional({ description: 'Sub system ID' })
  @IsString()
  @IsOptional()
  public subSystemId?: string;

  @ApiPropertyOptional({ description: 'Sub system class' })
  @IsString()
  @IsOptional()
  public subSystemClass?: string;

  @ApiPropertyOptional({ description: 'Sub system classification' })
  @IsString()
  @IsOptional()
  public subSystemClassification?: string;

  @ApiPropertyOptional({ description: 'Class ID' })
  @IsString()
  @IsOptional()
  public classId?: string;

  @ApiPropertyOptional({ description: 'Equipment served by' })
  @IsString()
  @IsOptional()
  public equipServedBy?: string;

  // Location fields
  @ApiPropertyOptional({ description: 'Customer name' })
  @IsString()
  @IsOptional()
  public customerName?: string;

  @ApiPropertyOptional({ description: 'Property name' })
  @IsString()
  @IsOptional()
  public propertyName?: string;

  @ApiPropertyOptional({ description: 'Building name' })
  @IsString()
  @IsOptional()
  public buildingName?: string;

  @ApiPropertyOptional({ description: 'Floor' })
  @IsString()
  @IsOptional()
  public floor?: string;

  @ApiPropertyOptional({ description: 'Floor name' })
  @IsString()
  @IsOptional()
  public floorName?: string;

  @ApiPropertyOptional({ description: 'Area' })
  @IsString()
  @IsOptional()
  public area?: string;

  @ApiPropertyOptional({ description: 'Room number' })
  @IsString()
  @IsOptional()
  public roomNumber?: string;

  @ApiPropertyOptional({ description: 'Asset location description' })
  @IsString()
  @IsOptional()
  public assetLocation?: string;

  @ApiPropertyOptional({ description: 'Property zone served' })
  @IsString()
  @IsOptional()
  public propertyZoneServed?: string;

  @ApiPropertyOptional({ description: 'X coordinate', type: 'number' })
  @Transform(({ value }: { value: unknown }) =>
    value ? parseFloat(value as string) : undefined,
  )
  @IsOptional()
  public xCoordinate?: number;

  @ApiPropertyOptional({ description: 'Y coordinate', type: 'number' })
  @Transform(({ value }: { value: unknown }) =>
    value ? parseFloat(value as string) : undefined,
  )
  @IsOptional()
  public yCoordinate?: number;

  // TCO & Cost fields
  @ApiPropertyOptional({
    description: 'Initial purchase cost',
    type: 'number',
    example: 15000.5,
  })
  @Transform(({ value }: { value: unknown }) =>
    value ? parseFloat(value as string) : undefined,
  )
  @IsOptional()
  public purchaseCost?: number;

  @ApiPropertyOptional({ description: 'Installation cost', type: 'number' })
  @Transform(({ value }: { value: unknown }) =>
    value ? parseFloat(value as string) : undefined,
  )
  @IsOptional()
  public installationCost?: number;

  @ApiPropertyOptional({
    description: 'Annual maintenance cost',
    type: 'number',
  })
  @Transform(({ value }: { value: unknown }) =>
    value ? parseFloat(value as string) : undefined,
  )
  @IsOptional()
  public annualMaintenanceCost?: number;

  @ApiPropertyOptional({
    description: 'Estimated annual operating cost',
    type: 'number',
  })
  @Transform(({ value }: { value: unknown }) =>
    value ? parseFloat(value as string) : undefined,
  )
  @IsOptional()
  public estimatedAnnualOperatingCost?: number;

  @ApiPropertyOptional({
    description: 'Expected disposal cost',
    type: 'number',
  })
  @Transform(({ value }: { value: unknown }) =>
    value ? parseFloat(value as string) : undefined,
  )
  @IsOptional()
  public disposalCost?: number;

  @ApiPropertyOptional({
    description: 'Expected salvage value',
    type: 'number',
  })
  @Transform(({ value }: { value: unknown }) =>
    value ? parseFloat(value as string) : undefined,
  )
  @IsOptional()
  public salvageValue?: number;

  @ApiPropertyOptional({ description: 'Calculated TCO', type: 'number' })
  @Transform(({ value }: { value: unknown }) =>
    value ? parseFloat(value as string) : undefined,
  )
  @IsOptional()
  public totalCostOfOwnership?: number;

  @ApiPropertyOptional({ description: 'Depreciation method' })
  @IsString()
  @IsOptional()
  public depreciationMethod?: string;

  @ApiPropertyOptional({ description: 'Current book value', type: 'number' })
  @Transform(({ value }: { value: unknown }) =>
    value ? parseFloat(value as string) : undefined,
  )
  @IsOptional()
  public currentBookValue?: number;

  // Energy fields
  @ApiPropertyOptional({
    description: 'Rated power in kilowatts',
    type: 'number',
    example: 12.5,
  })
  @Transform(({ value }: { value: unknown }) =>
    value ? parseFloat(value as string) : undefined,
  )
  @IsOptional()
  public ratedPowerKw?: number;

  @ApiPropertyOptional({
    description: 'Actual measured power in kilowatts',
    type: 'number',
  })
  @Transform(({ value }: { value: unknown }) =>
    value ? parseFloat(value as string) : undefined,
  )
  @IsOptional()
  public actualPowerKw?: number;

  @ApiPropertyOptional({
    description: 'Average daily operating hours',
    type: 'number',
  })
  @Transform(({ value }: { value: unknown }) =>
    value ? parseFloat(value as string) : undefined,
  )
  @IsOptional()
  public dailyOperatingHours?: number;

  @ApiPropertyOptional({
    description: 'Estimated annual kWh consumption',
    type: 'number',
  })
  @Transform(({ value }: { value: unknown }) =>
    value ? parseFloat(value as string) : undefined,
  )
  @IsOptional()
  public estimatedAnnualKwh?: number;

  @ApiPropertyOptional({ description: 'Voltage', type: 'integer' })
  @Transform(({ value }: { value: unknown }) =>
    value ? parseInt(value as string, 10) : undefined,
  )
  @IsInt()
  @IsOptional()
  public voltage?: number;

  @ApiPropertyOptional({ description: 'BTU rating', type: 'integer' })
  @Transform(({ value }: { value: unknown }) =>
    value ? parseInt(value as string, 10) : undefined,
  )
  @IsInt()
  @IsOptional()
  public btuRating?: number;

  // Lifecycle dates
  @ApiPropertyOptional({
    description: 'Installation date',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString()
  @IsOptional()
  public installDate?: string;

  @ApiPropertyOptional({
    description: 'Manufacture date',
    type: 'string',
    format: 'date-time',
  })
  @IsDateString()
  @IsOptional()
  public manufactureDate?: string;

  @ApiPropertyOptional({
    description: 'Service life in years',
    type: 'integer',
  })
  @Transform(({ value }: { value: unknown }) =>
    value ? parseInt(value as string, 10) : undefined,
  )
  @IsInt()
  @IsOptional()
  public serviceLife?: number;

  @ApiPropertyOptional({
    description: 'Expected lifetime in years',
    type: 'integer',
  })
  @Transform(({ value }: { value: unknown }) =>
    value ? parseInt(value as string, 10) : undefined,
  )
  @IsInt()
  @IsOptional()
  public expectedLifetime?: number;

  // Size & measurement
  @ApiPropertyOptional({ description: 'Equipment size' })
  @IsString()
  @IsOptional()
  public equipmentSize?: string;

  @ApiPropertyOptional({ description: 'Size' })
  @IsString()
  @IsOptional()
  public size?: string;

  @ApiPropertyOptional({ description: 'Unit of measurement' })
  @IsString()
  @IsOptional()
  public unit?: string;

  @ApiPropertyOptional({ description: 'Quantity', type: 'integer' })
  @Transform(({ value }: { value: unknown }) =>
    value ? parseInt(value as string, 10) : undefined,
  )
  @IsInt()
  @IsOptional()
  public quantity?: number;

  @ApiPropertyOptional({ description: 'Square feet', type: 'number' })
  @Transform(({ value }: { value: unknown }) =>
    value ? parseFloat(value as string) : undefined,
  )
  @IsOptional()
  public squareFeet?: number;

  @ApiPropertyOptional({ description: 'Weight', type: 'number' })
  @Transform(({ value }: { value: unknown }) =>
    value ? parseFloat(value as string) : undefined,
  )
  @IsOptional()
  public weight?: number;

  // Vendor & service
  @ApiPropertyOptional({ description: 'Vendor name' })
  @IsString()
  @IsOptional()
  public vendor?: string;

  @ApiPropertyOptional({ description: 'Vendor website' })
  @IsString()
  @IsOptional()
  public vendorWebsite?: string;

  @ApiPropertyOptional({ description: 'Service contract ID' })
  @IsString()
  @IsOptional()
  public serviceId?: string;

  // Status & metadata
  @ApiPropertyOptional({ description: 'Data verified flag', type: 'boolean' })
  @Transform(
    ({ value }: { value: unknown }) => value === 'true' || value === true,
  )
  @IsBoolean()
  @IsOptional()
  public verified?: boolean;

  @ApiPropertyOptional({ description: 'Owner ID' })
  @IsString()
  @IsOptional()
  public ownerId?: string;

  // Notes
  @ApiPropertyOptional({ description: 'General notes' })
  @IsString()
  @IsOptional()
  public notes?: string;
}
