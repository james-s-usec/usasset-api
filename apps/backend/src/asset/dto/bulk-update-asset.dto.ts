import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BulkUpdateAssetData } from './bulk-update-asset-data.dto';

export class BulkUpdateAssetsDto {
  @ApiProperty({
    description: 'Array of asset updates (id + fields to update)',
    type: [BulkUpdateAssetData],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpdateAssetData)
  public assets!: BulkUpdateAssetData[];
}
