import { Injectable } from '@nestjs/common';
import { Asset } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { UpdateAssetDto } from '../dto/update-asset.dto';
import { AssetNotFoundException } from '../exceptions/asset.exceptions';

@Injectable()
export class AssetService {
  public constructor(private readonly prisma: PrismaService) {}

  public async findAll(): Promise<{ assets: Asset[]; total: number }> {
    const [assets, total] = await Promise.all([
      this.prisma.asset.findMany({
        where: { is_deleted: false },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.asset.count({ where: { is_deleted: false } }),
    ]);

    return { assets, total };
  }

  public async findManyPaginated(
    page: number,
    limit: number,
  ): Promise<{ assets: Asset[]; total: number }> {
    const skip = (page - 1) * limit;

    const [assets, total] = await Promise.all([
      this.prisma.asset.findMany({
        skip,
        take: limit,
        where: { is_deleted: false },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.asset.count({ where: { is_deleted: false } }),
    ]);

    return { assets, total };
  }

  public async findById(id: string): Promise<Asset | null> {
    return this.prisma.asset.findUnique({
      where: { id, is_deleted: false },
    });
  }

  public async create(createAssetDto: CreateAssetDto): Promise<Asset> {
    return this.prisma.asset.create({
      data: createAssetDto,
    });
  }

  public async update(
    id: string,
    updateAssetDto: UpdateAssetDto,
  ): Promise<Asset> {
    const asset = await this.findById(id);
    if (!asset) {
      throw new AssetNotFoundException(id);
    }

    return this.prisma.asset.update({
      where: { id },
      data: updateAssetDto,
    });
  }

  public async delete(id: string): Promise<void> {
    const asset = await this.findById(id);
    if (!asset) {
      throw new AssetNotFoundException(id);
    }

    await this.prisma.asset.update({
      where: { id },
      data: { is_deleted: true },
    });
  }
}
