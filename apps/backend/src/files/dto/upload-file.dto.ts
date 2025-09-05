import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { FileType } from '@prisma/client';

export class UploadFileDto {
  @ApiPropertyOptional({ description: 'Folder ID to associate with the file' })
  @IsOptional()
  @IsString()
  public folder_id?: string;

  @ApiPropertyOptional({ description: 'Project ID to associate with the file' })
  @IsOptional()
  @IsString()
  public project_id?: string;

  @ApiPropertyOptional({ description: 'Asset ID to associate with the file' })
  @IsOptional()
  @IsString()
  public asset_id?: string;

  @ApiPropertyOptional({
    description: 'File type categorization',
    enum: FileType,
    default: FileType.DOCUMENT,
  })
  @IsOptional()
  @IsEnum(FileType)
  public file_type?: FileType;
}
