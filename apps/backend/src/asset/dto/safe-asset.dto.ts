import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { AssetStatus } from '@prisma/client';

/**
 * Safe asset response DTO that excludes sensitive audit fields
 * Following YAGNI - only expose what frontend needs
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

  @ApiProperty({ description: 'Asset creation timestamp' })
  @Expose()
  public created_at!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  public updated_at!: Date;

  // Explicitly excluded: is_deleted
}
