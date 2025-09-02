import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { ProjectMember, ProjectRole, Prisma } from '@prisma/client';

interface ProjectMemberWithRelations extends ProjectMember {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  project?: {
    id: string;
    name: string;
    description: string | null;
    status: string;
  };
}

@Injectable()
export class ProjectMemberRepository {
  public constructor(private prisma: PrismaService) {}

  public async findProjectMembers(
    projectId: string,
  ): Promise<ProjectMemberWithRelations[]> {
    return this.prisma.projectMember.findMany({
      where: { project_id: projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { joined_at: 'desc' },
    });
  }

  public async findUserProjects(
    userId: string,
  ): Promise<ProjectMemberWithRelations[]> {
    return this.prisma.projectMember.findMany({
      where: { user_id: userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
          },
        },
      },
      orderBy: { joined_at: 'desc' },
    });
  }

  public async assignUserToProject(
    projectId: string,
    userId: string,
    role: ProjectRole,
  ): Promise<ProjectMemberWithRelations> {
    return this.prisma.projectMember.create({
      data: {
        project_id: projectId,
        user_id: userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
          },
        },
      },
    });
  }

  public async updateMemberRole(
    projectId: string,
    userId: string,
    role: ProjectRole,
  ): Promise<ProjectMember> {
    return this.prisma.projectMember.update({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: userId,
        },
      },
      data: { role },
    });
  }

  public async removeUserFromProject(
    projectId: string,
    userId: string,
  ): Promise<ProjectMember> {
    return this.prisma.projectMember.delete({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: userId,
        },
      },
    });
  }

  public async bulkAssignUsers(
    projectId: string,
    assignments: Array<{ user_id: string; role: ProjectRole }>,
  ): Promise<Prisma.BatchPayload> {
    const data = assignments.map(({ user_id, role }) => ({
      project_id: projectId,
      user_id,
      role,
    }));

    return this.prisma.projectMember.createMany({
      data,
      skipDuplicates: true,
    });
  }

  public async isMember(projectId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: userId,
        },
      },
    });
    return !!member;
  }

  public async getMemberRole(
    projectId: string,
    userId: string,
  ): Promise<ProjectRole | null> {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: userId,
        },
      },
    });
    return member?.role ?? null;
  }
}
