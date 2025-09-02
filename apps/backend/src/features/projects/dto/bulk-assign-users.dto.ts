import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AssignUserToProjectDto } from './assign-user-to-project.dto';

export class BulkAssignUsersDto {
  @ApiProperty({
    description: 'Array of user assignments',
    type: [AssignUserToProjectDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignUserToProjectDto)
  public assignments!: AssignUserToProjectDto[];
}
