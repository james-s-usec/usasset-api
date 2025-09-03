import { IsString, IsOptional, IsHexColor, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const MAX_FOLDER_NAME_LENGTH = 50;
const MAX_FOLDER_DESCRIPTION_LENGTH = 200;

export class CreateFolderDto {
  @ApiProperty({ example: 'Project Photos', description: 'Folder name' })
  @IsString()
  @MaxLength(MAX_FOLDER_NAME_LENGTH)
  public name!: string;

  @ApiPropertyOptional({
    example: 'Photos from construction site',
    description: 'Folder description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_FOLDER_DESCRIPTION_LENGTH)
  public description?: string;

  @ApiPropertyOptional({
    example: '#4CAF50',
    description: 'Folder color for UI theming',
  })
  @IsOptional()
  @IsHexColor()
  public color?: string;
}
