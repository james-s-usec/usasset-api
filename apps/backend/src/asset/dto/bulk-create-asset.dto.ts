import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAssetDto } from './create-asset.dto';

export class BulkCreateAssetsDto {
  @ApiProperty({
    description: 'Array of assets to create',
    type: [CreateAssetDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAssetDto)
  public assets!: CreateAssetDto[];
}
