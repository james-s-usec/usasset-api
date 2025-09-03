import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetStatus } from '@prisma/client';

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
}
