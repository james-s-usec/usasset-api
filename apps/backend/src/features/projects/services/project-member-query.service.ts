import { Injectable } from '@nestjs/common';
import { ProjectMemberRepository } from '../project-member.repository';
import { ProjectMemberDto } from '../dto/project-member.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ProjectMemberQueryService {
  public constructor(private memberRepository: ProjectMemberRepository) {}

  public async getProjectMembers(
    projectId: string,
  ): Promise<ProjectMemberDto[]> {
    const members = await this.memberRepository.findProjectMembers(projectId);

    return members.map((member) =>
      plainToInstance(
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
      ),
    );
  }

  public async getUserProjects(userId: string): Promise<
    Array<{
      id: string | undefined;
      name: string | undefined;
      description: string | null | undefined;
      status: string | undefined;
      role: string;
      joined_at: Date;
    }>
  > {
    const memberships = await this.memberRepository.findUserProjects(userId);

    return memberships.map((membership) => ({
      id: membership.project?.id,
      name: membership.project?.name,
      description: membership.project?.description,
      status: membership.project?.status,
      role: membership.role,
      joined_at: membership.joined_at,
    }));
  }

  public async isMember(projectId: string, userId: string): Promise<boolean> {
    return this.memberRepository.isMember(projectId, userId);
  }

  public async getMemberRole(
    projectId: string,
    userId: string,
  ): Promise<string | null> {
    const role = await this.memberRepository.getMemberRole(projectId, userId);
    return role;
  }
}
