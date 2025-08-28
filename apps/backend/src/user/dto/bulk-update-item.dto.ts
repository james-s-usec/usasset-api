import { IsUUID } from 'class-validator';
import { UpdateUserDto } from './update-user.dto';

export class BulkUpdateItemDto extends UpdateUserDto {
  @IsUUID()
  public id!: string;
}
