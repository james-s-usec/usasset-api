import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ProjectRole } from '@prisma/client';
import { UserInfoDto } from './user-info.dto';

export class ProjectMemberDto {
  @ApiProperty()
  @Expose()
  public id!: string;

  @ApiProperty({ description: 'User information' })
  @Expose()
  @Type(() => UserInfoDto)
  public user!: UserInfoDto;

  @ApiProperty({ enum: ProjectRole })
  @Expose()
  public role!: ProjectRole;

  @ApiProperty()
  @Expose()
  public joined_at!: Date;
}
