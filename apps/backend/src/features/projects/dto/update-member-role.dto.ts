import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole } from '@prisma/client';

export class UpdateMemberRoleDto {
  @ApiProperty({
    description: 'New role for the project member',
    enum: ProjectRole,
  })
  @IsEnum(ProjectRole)
  public role!: ProjectRole;
}
