import { Type } from 'class-transformer';
import {
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { BulkUpdateItemDto } from './bulk-update-item.dto';
import { MAX_BULK_OPERATION_SIZE } from '../../common/constants';

export class BulkUpdateUserDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BULK_OPERATION_SIZE)
  @Type(() => BulkUpdateItemDto)
  public updates!: BulkUpdateItemDto[];
}
