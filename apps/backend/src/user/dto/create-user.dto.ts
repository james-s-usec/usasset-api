import { IsEmail, IsOptional, IsEnum, IsString } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  @IsEmail()
  public email!: string;

  @IsOptional()
  @IsString()
  public name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  public role?: UserRole;
}
