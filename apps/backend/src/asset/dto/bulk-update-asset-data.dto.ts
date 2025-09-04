import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { UpdateAssetDto } from './update-asset.dto';

export class BulkUpdateAssetData extends UpdateAssetDto {
  @ApiProperty({ description: 'Asset ID to update' })
  @IsUUID()
  public id!: string;
}
