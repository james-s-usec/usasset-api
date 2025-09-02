import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRepository } from '../project.repository';
import { SafeProjectDto } from '../dto/safe-project.dto';
import { plainToInstance } from 'class-transformer';
import { Project } from '@prisma/client';

interface PaginatedProjectsResponse {
  data: SafeProjectDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class ProjectQueryService {
  public constructor(private projectRepository: ProjectRepository) {}

  public async findManyPaginated(
    page: number,
    limit: number,
  ): Promise<PaginatedProjectsResponse> {
    const result = await this.projectRepository.findManyPaginated(page, limit);

    return {
      data: result.data.map((project) => this.toSafeDto(project)),
      meta: result.meta,
    };
  }

  public async findById(id: string): Promise<SafeProjectDto> {
    const project = await this.projectRepository.findById(id);

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return this.toSafeDto(project);
  }

  public async findByOwnerId(
    ownerId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedProjectsResponse> {
    const result = await this.projectRepository.findByOwnerId(
      ownerId,
      page,
      limit,
    );

    return {
      data: result.data.map((project) => this.toSafeDto(project)),
      meta: result.meta,
    };
  }

  public async exists(id: string): Promise<boolean> {
    const project = await this.projectRepository.findById(id);
    return !!project;
  }

  private toSafeDto(project: Project): SafeProjectDto {
    return plainToInstance(
      SafeProjectDto,
      {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        owner_id: project.owner_id,
        created_at: project.created_at,
        updated_at: project.updated_at,
      },
      { excludeExtraneousValues: true },
    );
  }
}
