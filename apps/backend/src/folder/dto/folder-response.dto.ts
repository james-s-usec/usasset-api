import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FolderResponseDto {
  @ApiProperty({ example: 'uuid-string', description: 'Folder ID' })
  public id!: string;

  @ApiProperty({ example: 'Project Photos', description: 'Folder name' })
  public name!: string;

  @ApiPropertyOptional({
    example: 'Photos from construction site',
    description: 'Folder description',
  })
  public description?: string;

  @ApiPropertyOptional({ example: '#4CAF50', description: 'Folder color' })
  public color?: string;

  @ApiProperty({
    example: false,
    description: 'Whether this is a default system folder',
  })
  public is_default!: boolean;

  @ApiProperty({ example: 5, description: 'Number of files in this folder' })
  public file_count!: number;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Project ID that this folder belongs to',
  })
  public project_id!: string;

  @ApiProperty({
    example: '2023-09-03T18:30:00Z',
    description: 'Creation timestamp',
  })
  public created_at!: Date;

  @ApiProperty({
    example: '2023-09-03T18:30:00Z',
    description: 'Last update timestamp',
  })
  public updated_at!: Date;
}
