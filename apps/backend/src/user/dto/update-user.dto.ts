import { IsOptional, IsString, IsEnum } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  public name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  public role?: UserRole;
}
