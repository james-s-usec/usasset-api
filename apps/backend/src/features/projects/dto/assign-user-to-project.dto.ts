import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole } from '@prisma/client';

export class AssignUserToProjectDto {
  @ApiProperty({ description: 'User ID to assign to project' })
  @IsUUID()
  public user_id!: string;

  @ApiProperty({
    description: 'Role for the user in the project',
    enum: ProjectRole,
    default: ProjectRole.MEMBER,
    required: false,
  })
  @IsEnum(ProjectRole)
  @IsOptional()
  public role?: ProjectRole = ProjectRole.MEMBER;
}
