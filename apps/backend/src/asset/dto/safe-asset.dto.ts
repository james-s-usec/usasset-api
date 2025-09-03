import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

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

  @ApiProperty({ description: 'Asset creation timestamp' })
  @Expose()
  public created_at!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  public updated_at!: Date;

  // Explicitly excluded: is_deleted
}
