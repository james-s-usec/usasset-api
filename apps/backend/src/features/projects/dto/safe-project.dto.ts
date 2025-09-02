import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ProjectStatus } from '@prisma/client';

export class SafeProjectDto {
  @ApiProperty()
  @Expose()
  public id!: string;

  @ApiProperty()
  @Expose()
  public name!: string;

  @ApiProperty({ nullable: true })
  @Expose()
  public description!: string | null;

  @ApiProperty({ enum: ProjectStatus })
  @Expose()
  public status!: ProjectStatus;

  @ApiProperty({ nullable: true })
  @Expose()
  public owner_id!: string | null;

  @ApiProperty()
  @Expose()
  public created_at!: Date;

  @ApiProperty()
  @Expose()
  public updated_at!: Date;

  // Excludes sensitive fields: created_by, updated_by, deleted_by, deleted_at
}
