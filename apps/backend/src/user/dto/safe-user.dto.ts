import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserRole } from '@prisma/client';

/**
 * Safe user response DTO that excludes sensitive audit fields
 * Following YAGNI - only expose what frontend needs
 */
export class SafeUserDto {
  @ApiProperty({ description: 'User unique identifier' })
  @Expose()
  public id!: string;

  @ApiProperty({ description: 'User email address' })
  @Expose()
  public email!: string;

  @ApiProperty({ description: 'User display name', required: false })
  @Expose()
  public name!: string | null;

  @ApiProperty({ description: 'User role', enum: UserRole })
  @Expose()
  public role!: UserRole;

  @ApiProperty({ description: 'Account creation timestamp' })
  @Expose()
  public created_at!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  public updated_at!: Date;

  // Explicitly excluded: created_by, updated_by, deleted_by, deleted_at, is_deleted
}
