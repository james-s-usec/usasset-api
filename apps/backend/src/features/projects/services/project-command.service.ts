import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRepository } from '../project.repository';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { SafeProjectDto } from '../dto/safe-project.dto';
import { plainToInstance } from 'class-transformer';
import { Project } from '@prisma/client';

@Injectable()
export class ProjectCommandService {
  public constructor(private projectRepository: ProjectRepository) {}

  public async create(dto: CreateProjectDto): Promise<SafeProjectDto> {
    const project = await this.projectRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      status: dto.status ?? 'DRAFT',
      is_deleted: false,
      owner: {
        connect: { id: dto.owner_id },
      },
    });

    return this.toSafeDto(project);
  }

  public async update(
    id: string,
    dto: UpdateProjectDto,
  ): Promise<SafeProjectDto> {
    const existing = await this.projectRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    const updated = await this.projectRepository.update(id, {
      name: dto.name,
      description: dto.description,
      status: dto.status,
    });

    return this.toSafeDto(updated);
  }

  public async delete(id: string): Promise<void> {
    const existing = await this.projectRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    await this.projectRepository.softDelete(id);
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
