import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';

export class CreateProjectDto {
  @ApiProperty({ description: 'Project name' })
  @IsString()
  public name!: string;

  @ApiProperty({ description: 'Project description', required: false })
  @IsString()
  @IsOptional()
  public description?: string;

  @ApiProperty({
    description: 'Project status',
    enum: ProjectStatus,
    default: ProjectStatus.DRAFT,
    required: false,
  })
  @IsEnum(ProjectStatus)
  @IsOptional()
  public status?: ProjectStatus;

  @ApiProperty({ description: 'Project owner ID', required: false })
  @IsUUID()
  @IsOptional()
  public owner_id?: string;
}
