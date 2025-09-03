import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { FolderResponseDto } from './dto/folder-response.dto';
import { Folder } from '@prisma/client';

@Injectable()
export class FolderService {
  public constructor(private readonly prisma: PrismaService) {}

  public async findAll(): Promise<FolderResponseDto[]> {
    const folders = await this.prisma.folder.findMany({
      where: { is_deleted: false },
      include: {
        _count: {
          select: { files: { where: { is_deleted: false } } },
        },
      },
      orderBy: [
        { is_default: 'desc' }, // Default folders first
        { name: 'asc' },
      ],
    });

    return folders.map((folder) => this.mapToResponseDto(folder));
  }

  public async findOne(id: string): Promise<FolderResponseDto> {
    const folder = await this.prisma.folder.findUnique({
      where: { id, is_deleted: false },
      include: {
        _count: {
          select: { files: { where: { is_deleted: false } } },
        },
      },
    });

    if (!folder) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    return this.mapToResponseDto(folder);
  }

  public async create(
    createFolderDto: CreateFolderDto,
  ): Promise<FolderResponseDto> {
    try {
      const folder = await this.prisma.folder.create({
        data: {
          ...createFolderDto,
          is_default: false, // User-created folders are never default
        },
        include: {
          _count: {
            select: { files: { where: { is_deleted: false } } },
          },
        },
      });

      return this.mapToResponseDto(folder);
    } catch (error: unknown) {
      if (this.isPrismaUniqueConstraintError(error)) {
        throw new ConflictException(
          `Folder with name '${createFolderDto.name}' already exists`,
        );
      }
      throw error;
    }
  }

  public async update(
    id: string,
    updateFolderDto: UpdateFolderDto,
  ): Promise<FolderResponseDto> {
    const existingFolder = await this.prisma.folder.findUnique({
      where: { id, is_deleted: false },
    });

    if (!existingFolder) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    try {
      const folder = await this.prisma.folder.update({
        where: { id },
        data: updateFolderDto,
        include: {
          _count: {
            select: { files: { where: { is_deleted: false } } },
          },
        },
      });

      return this.mapToResponseDto(folder);
    } catch (error: unknown) {
      if (this.isPrismaUniqueConstraintError(error)) {
        throw new ConflictException(
          `Folder with name '${updateFolderDto.name}' already exists`,
        );
      }
      throw error;
    }
  }

  public async delete(id: string): Promise<void> {
    const folder = await this.prisma.folder.findUnique({
      where: { id, is_deleted: false },
      include: {
        _count: {
          select: { files: { where: { is_deleted: false } } },
        },
      },
    });

    if (!folder) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    if (folder.is_default) {
      throw new BadRequestException('Cannot delete default system folders');
    }

    if (folder._count.files > 0) {
      throw new BadRequestException(
        `Cannot delete folder with ${folder._count.files} files. Move files to another folder first.`,
      );
    }

    await this.prisma.folder.update({
      where: { id },
      data: {
        is_deleted: true,
      },
    });
  }

  private isPrismaUniqueConstraintError(
    error: unknown,
  ): error is { code: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    );
  }

  private mapToResponseDto(
    folder: Folder & { _count: { files: number } },
  ): FolderResponseDto {
    return {
      id: folder.id,
      name: folder.name,
      description: folder.description ?? undefined,
      color: folder.color ?? undefined,
      is_default: folder.is_default,
      file_count: folder._count.files,
      created_at: folder.created_at,
      updated_at: folder.updated_at,
    };
  }
}
