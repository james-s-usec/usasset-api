import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsUUID, IsOptional } from 'class-validator';

export class BulkDeleteAssetsDto {
  @ApiProperty({
    description: 'Array of asset IDs to delete',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  public ids!: string[];

  @ApiPropertyOptional({
    description: 'Perform hard delete instead of soft delete',
    default: false,
  })
  @IsOptional()
  public hardDelete?: boolean = false;
}
