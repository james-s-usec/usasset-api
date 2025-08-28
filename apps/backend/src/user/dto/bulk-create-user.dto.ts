import { Type } from 'class-transformer';
import {
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { MAX_BULK_OPERATION_SIZE } from '../../common/constants';

export class BulkCreateUserDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BULK_OPERATION_SIZE)
  @Type(() => CreateUserDto)
  public users!: CreateUserDto[];
}
