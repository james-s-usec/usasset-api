import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsNumberString,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { AssetStatus, AssetCondition } from '@prisma/client';

export class AssetSearchDto {
  @ApiPropertyOptional({
    description:
      'Search term (matches name, manufacturer, model, serial, description)',
  })
  @IsOptional()
  @IsString()
  public search?: string;

  @ApiPropertyOptional({
    enum: AssetStatus,
    description: 'Filter by asset status',
  })
  @IsOptional()
  @IsEnum(AssetStatus)
  public status?: AssetStatus;

  @ApiPropertyOptional({
    enum: AssetCondition,
    description: 'Filter by asset condition',
  })
  @IsOptional()
  @IsEnum(AssetCondition)
  public condition?: AssetCondition;

  @ApiPropertyOptional({ description: 'Filter by manufacturer' })
  @IsOptional()
  @IsString()
  public manufacturer?: string;

  @ApiPropertyOptional({ description: 'Filter by building name' })
  @IsOptional()
  @IsString()
  public buildingName?: string;

  @ApiPropertyOptional({ description: 'Filter by floor' })
  @IsOptional()
  @IsString()
  public floor?: string;

  @ApiPropertyOptional({ description: 'Filter by room number' })
  @IsOptional()
  @IsString()
  public roomNumber?: string;

  @ApiPropertyOptional({ description: 'Filter by trade/department' })
  @IsOptional()
  @IsString()
  public trade?: string;

  @ApiPropertyOptional({ description: 'Filter by asset category' })
  @IsOptional()
  @IsString()
  public assetCategory?: string;

  @ApiPropertyOptional({ description: 'Filter by asset type' })
  @IsOptional()
  @IsString()
  public assetType?: string;

  @ApiPropertyOptional({ description: 'Filter by project ID' })
  @IsOptional()
  @IsUUID()
  public projectId?: string;

  // Date range filters
  @ApiPropertyOptional({ description: 'Installation date from (ISO date)' })
  @IsOptional()
  @IsDateString()
  public installDateFrom?: string;

  @ApiPropertyOptional({ description: 'Installation date to (ISO date)' })
  @IsOptional()
  @IsDateString()
  public installDateTo?: string;

  @ApiPropertyOptional({ description: 'Purchase date from (ISO date)' })
  @IsOptional()
  @IsDateString()
  public purchaseDateFrom?: string;

  @ApiPropertyOptional({ description: 'Purchase date to (ISO date)' })
  @IsOptional()
  @IsDateString()
  public purchaseDateTo?: string;

  // Cost range filters
  @ApiPropertyOptional({ description: 'Minimum purchase cost' })
  @IsOptional()
  @IsNumberString()
  @Transform(({ value }: { value: string }) =>
    value ? parseFloat(value) : undefined,
  )
  public purchaseCostMin?: number;

  @ApiPropertyOptional({ description: 'Maximum purchase cost' })
  @IsOptional()
  @IsNumberString()
  @Transform(({ value }: { value: string }) =>
    value ? parseFloat(value) : undefined,
  )
  public purchaseCostMax?: number;

  // Warranty filters
  @ApiPropertyOptional({
    description: 'Assets with warranty expiring from date',
  })
  @IsOptional()
  @IsDateString()
  public warrantyExpiringFrom?: string;

  @ApiPropertyOptional({ description: 'Assets with warranty expiring to date' })
  @IsOptional()
  @IsDateString()
  public warrantyExpiringTo?: string;

  // Additional filters
  @ApiPropertyOptional({ description: 'Filter by customer name' })
  @IsOptional()
  @IsString()
  public customerName?: string;

  @ApiPropertyOptional({ description: 'Filter by property name' })
  @IsOptional()
  @IsString()
  public propertyName?: string;

  // Sorting
  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: [
      'name',
      'assetTag',
      'manufacturer',
      'installDate',
      'purchaseDate',
      'purchaseCost',
      'created_at',
    ],
    default: 'created_at',
  })
  @IsOptional()
  @IsString()
  public sortBy?: string = 'created_at';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  public sortOrder?: 'asc' | 'desc' = 'desc';
}
