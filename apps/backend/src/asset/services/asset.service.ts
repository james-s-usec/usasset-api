import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { Asset } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { UpdateAssetDto } from '../dto/update-asset.dto';
import { AssetNotFoundException } from '../exceptions/asset.exceptions';
import { SimpleCacheService } from '../../common/services/simple-cache.service';

@Injectable()
export class AssetService {
  private readonly logger = new Logger(AssetService.name);

  public constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SimpleCacheService,
  ) {}

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
    try {
      const asset = await this.prisma.asset.create({
        data: createAssetDto,
      });
      
      // Clear cache after creating new asset
      this.cache.clearPattern('asset:*');
      this.logger.log('Cache cleared after asset creation');
      
      return asset;
    } catch (error: unknown) {
      if (this.isPrismaUniqueConstraintError(error)) {
        throw new ConflictException(
          `Asset with tag '${createAssetDto.assetTag}' already exists`,
        );
      }
      throw error;
    }
  }

  public async update(
    id: string,
    updateAssetDto: UpdateAssetDto,
  ): Promise<Asset> {
    const asset = await this.findById(id);
    if (!asset) {
      throw new AssetNotFoundException(id);
    }

    try {
      const updatedAsset = await this.prisma.asset.update({
        where: { id },
        data: updateAssetDto,
      });
      
      // Clear cache after updating asset
      this.cache.clearPattern('asset:*');
      this.logger.log('Cache cleared after asset update');
      
      return updatedAsset;
    } catch (error: unknown) {
      if (this.isPrismaUniqueConstraintError(error)) {
        throw new ConflictException(
          `Asset with tag '${updateAssetDto.assetTag}' already exists`,
        );
      }
      throw error;
    }
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

  public async clearAllAssets(): Promise<{
    message: string;
    deletedCount: number;
  }> {
    const result = await this.prisma.asset.deleteMany({});
    return {
      message: `Cleared all assets from database`,
      deletedCount: result.count,
    };
  }
}
