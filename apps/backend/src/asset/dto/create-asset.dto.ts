import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssetDto {
  @ApiProperty({
    description: 'Asset tag identifier',
    example: 'ASSET-001',
  })
  @IsString()
  @IsNotEmpty()
  public assetTag!: string;

  @ApiProperty({
    description: 'Asset name',
    example: 'Dell Laptop',
  })
  @IsString()
  @IsNotEmpty()
  public name!: string;
}
