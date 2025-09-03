import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAssetDto {
  @ApiPropertyOptional({
    description: 'Asset tag identifier',
    example: 'ASSET-001',
  })
  @IsOptional()
  @IsString()
  public assetTag?: string;

  @ApiPropertyOptional({
    description: 'Asset name',
    example: 'Dell Laptop',
  })
  @IsOptional()
  @IsString()
  public name?: string;
}
