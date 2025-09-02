import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { Project, Prisma } from '@prisma/client';

interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class ProjectRepository {
  private readonly ownerInclude = {
    owner: {
      select: {
        id: true,
        email: true,
        name: true,
      },
    },
  };

  public constructor(private prisma: PrismaService) {}

  public async findManyPaginated(
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Project>> {
    const where = { is_deleted: false };
    return this.findPaginated(where, page, limit);
  }

  public async findById(id: string): Promise<Project | null> {
    return this.prisma.project.findFirst({
      where: { id, is_deleted: false },
      include: this.ownerInclude,
    });
  }

  public async create(data: Prisma.ProjectCreateInput): Promise<Project> {
    return this.prisma.project.create({
      data,
      include: this.ownerInclude,
    });
  }

  public async update(
    id: string,
    data: Prisma.ProjectUpdateInput,
  ): Promise<Project> {
    return this.prisma.project.update({
      where: { id },
      data,
      include: this.ownerInclude,
    });
  }

  public async softDelete(id: string): Promise<Project> {
    return this.prisma.project.update({
      where: { id },
      data: {
        is_deleted: true,
        deleted_at: new Date(),
      },
    });
  }

  public async findByOwnerId(
    ownerId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Project>> {
    const where = {
      owner_id: ownerId,
      is_deleted: false,
    };
    return this.findPaginated(where, page, limit);
  }

  private async findPaginated(
    where: Prisma.ProjectWhereInput,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Project>> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: this.ownerInclude,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
