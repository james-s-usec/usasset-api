import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole } from '@prisma/client';

export class ProjectMemberDto {
  @ApiProperty()
  public id!: string;

  @ApiProperty({ description: 'User information' })
  public user!: {
    id: string;
    email: string;
    name: string | null;
  };

  @ApiProperty({ enum: ProjectRole })
  public role!: ProjectRole;

  @ApiProperty()
  public joined_at!: Date;
}
