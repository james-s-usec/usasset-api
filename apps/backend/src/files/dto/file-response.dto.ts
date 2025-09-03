import { ApiProperty } from '@nestjs/swagger';

export class FileResponseDto {
  @ApiProperty({ description: 'File unique identifier' })
  public id!: string;

  @ApiProperty({ description: 'Stored filename' })
  public filename!: string;

  @ApiProperty({ description: 'Original uploaded filename' })
  public original_name!: string;

  @ApiProperty({ description: 'File MIME type' })
  public mimetype!: string;

  @ApiProperty({ description: 'File size in bytes' })
  public size!: number;

  @ApiProperty({ description: 'Upload timestamp' })
  public created_at!: Date;
}
