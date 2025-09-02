import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';

export class SafeProjectDto {
  @ApiProperty()
  public id!: string;

  @ApiProperty()
  public name!: string;

  @ApiProperty({ nullable: true })
  public description!: string | null;

  @ApiProperty({ enum: ProjectStatus })
  public status!: ProjectStatus;

  @ApiProperty()
  public owner_id!: string;

  @ApiProperty()
  public created_at!: Date;

  @ApiProperty()
  public updated_at!: Date;

  // Excludes sensitive fields: created_by, updated_by, deleted_by, deleted_at
}
