import { ApiProperty } from '@nestjs/swagger';
import { FileType } from '@prisma/client';

export class AssetDocumentResponseDto {
  @ApiProperty({ example: 'uuid', description: 'Document ID' })
  public id!: string;

  @ApiProperty({ example: 'manual.pdf', description: 'Current filename' })
  public filename!: string;

  @ApiProperty({ example: 'HVAC Manual.pdf', description: 'Original filename' })
  public original_name!: string;

  @ApiProperty({ example: 'application/pdf', description: 'MIME type' })
  public mimetype!: string;

  @ApiProperty({ example: 1024000, description: 'File size in bytes' })
  public size!: number;

  @ApiProperty({ enum: FileType, description: 'Document type categorization' })
  public file_type!: FileType;

  @ApiProperty({ example: 'uuid', description: 'Asset ID' })
  public asset_id!: string;

  @ApiProperty({ example: 'Main Chiller Unit', description: 'Asset name' })
  public asset_name?: string;

  @ApiProperty({ example: 'HVAC-001', description: 'Asset tag' })
  public asset_tag?: string;

  @ApiProperty({ description: 'Document creation date' })
  public created_at!: Date;

  @ApiProperty({ description: 'Document last update date' })
  public updated_at!: Date;
}
