import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export class ProjectSearchDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value as string, 10) : 1))
  @IsInt()
  @Min(1)
  public page?: number;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10 })
  @IsOptional()
  @Transform(({ value }) =>
    value ? parseInt(value as string, 10) : DEFAULT_PAGE_SIZE,
  )
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  public limit?: number;

  @ApiPropertyOptional({ description: 'Search by name' })
  @IsOptional()
  @IsString()
  public name?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  public status?: ProjectStatus;

  @ApiPropertyOptional({ description: 'Filter by owner ID' })
  @IsOptional()
  @IsString()
  public owner_id?: string;
}
