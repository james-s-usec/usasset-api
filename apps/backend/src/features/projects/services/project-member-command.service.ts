import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ProjectMemberRepository } from '../project-member.repository';
import { ProjectRepository } from '../project.repository';
import { AssignUserToProjectDto } from '../dto/assign-user-to-project.dto';
import { BulkAssignUsersDto } from '../dto/bulk-assign-users.dto';
import { UpdateMemberRoleDto } from '../dto/update-member-role.dto';
import { ProjectMemberDto } from '../dto/project-member.dto';
import { ProjectRole, ProjectMember, User } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '@/database/prisma.service';

interface ProjectMemberWithUser extends ProjectMember {
  user: Pick<User, 'id' | 'email' | 'name'>;
}

@Injectable()
export class ProjectMemberCommandService {
  public constructor(
    private memberRepository: ProjectMemberRepository,
    private projectRepository: ProjectRepository,
    private prisma: PrismaService,
  ) {}

  public async assignUserToProject(
    projectId: string,
    dto: AssignUserToProjectDto,
  ): Promise<ProjectMemberDto> {
    await this.validateProjectAndUser(projectId, dto.user_id);

    const member = await this.memberRepository.assignUserToProject(
      projectId,
      dto.user_id,
      dto.role || ProjectRole.MEMBER,
    );

    return this.toProjectMemberDto(member);
  }

  private async validateProjectAndUser(
    projectId: string,
    userId: string,
  ): Promise<void> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMember = await this.memberRepository.isMember(projectId, userId);
    if (isMember) {
      throw new ConflictException('User is already a member of this project');
    }
  }

  private toProjectMemberDto(member: ProjectMemberWithUser): ProjectMemberDto {
    return plainToInstance(
      ProjectMemberDto,
      {
        id: member.id,
        user: {
          id: member.user.id,
          email: member.user.email,
          name: member.user.name,
        },
        role: member.role,
        joined_at: member.joined_at,
      },
      { excludeExtraneousValues: true },
    );
  }

  public async updateMemberRole(
    projectId: string,
    userId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<void> {
    const isMember = await this.memberRepository.isMember(projectId, userId);
    if (!isMember) {
      throw new NotFoundException('Member not found in project');
    }

    await this.memberRepository.updateMemberRole(projectId, userId, dto.role);
  }

  public async removeUserFromProject(
    projectId: string,
    userId: string,
  ): Promise<void> {
    const isMember = await this.memberRepository.isMember(projectId, userId);
    if (!isMember) {
      throw new NotFoundException('Member not found in project');
    }

    await this.memberRepository.removeUserFromProject(projectId, userId);
  }

  public async bulkAssignUsers(
    projectId: string,
    dto: BulkAssignUsersDto,
  ): Promise<{ count: number }> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const assignments = dto.assignments.map((a) => ({
      user_id: a.user_id,
      role: a.role || ProjectRole.MEMBER,
    }));

    const result = await this.memberRepository.bulkAssignUsers(
      projectId,
      assignments,
    );

    return { count: result.count };
  }
}
