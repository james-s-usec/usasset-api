import { ApiProperty } from '@nestjs/swagger';

export class BulkOperationResult {
  @ApiProperty({ description: 'Number of successful operations' })
  public successful!: number;

  @ApiProperty({ description: 'Number of failed operations' })
  public failed!: number;

  @ApiProperty({ description: 'Total operations attempted' })
  public total!: number;

  @ApiProperty({
    description: 'Array of error details for failed operations',
    type: [Object],
  })
  public errors!: Array<{
    index?: number;
    id?: string;
    error: string;
    field?: string;
  }>;

  @ApiProperty({
    description: 'Array of successfully processed asset IDs',
    type: [String],
  })
  public successfulIds!: string[];
}
