import { IsArray, IsUUID, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { MAX_BULK_OPERATION_SIZE } from '../../common/constants';

export class BulkDeleteUserDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BULK_OPERATION_SIZE)
  public ids!: string[];
}
