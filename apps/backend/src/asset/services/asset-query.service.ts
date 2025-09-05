import { Injectable, Logger } from '@nestjs/common';
import { Asset, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AssetSearchDto } from '../dto/asset-search.dto';
import { SimpleCacheService } from '../../common/services/simple-cache.service';

const CACHE_CONSTANTS = {
  SUMMARY_TTL_SECONDS: 300,
};

@Injectable()
export class AssetQueryService {
  private readonly logger = new Logger(AssetQueryService.name);

  public constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SimpleCacheService,
  ) {}

  public async findManyWithSearch(
    searchParams: AssetSearchDto,
    page: number,
    limit: number,
  ): Promise<{ assets: Asset[]; total: number }> {
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(searchParams);
    const orderBy = this.buildOrderBy(
      searchParams.sortBy,
      searchParams.sortOrder,
    );

    const [assets, total] = await Promise.all([
      this.prisma.asset.findMany({
        skip,
        take: limit,
        where,
        orderBy,
      }),
      this.prisma.asset.count({ where }),
    ]);

    return { assets, total };
  }

  private buildWhereClause(
    searchParams: AssetSearchDto,
  ): Prisma.AssetWhereInput {
    const where: Prisma.AssetWhereInput = { is_deleted: false };

    this.addTextSearch(where, searchParams);
    this.addExactMatches(where, searchParams);
    this.addStringFilters(where, searchParams);
    this.addDateRangeFilters(where, searchParams);
    this.addCostRangeFilters(where, searchParams);

    return where;
  }

  private addTextSearch(
    where: Prisma.AssetWhereInput,
    searchParams: AssetSearchDto,
  ): void {
    if (searchParams.search) {
      const searchTerm = searchParams.search.toLowerCase();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { manufacturer: { contains: searchTerm, mode: 'insensitive' } },
        { modelNumber: { contains: searchTerm, mode: 'insensitive' } },
        { serialNumber: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { assetTag: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
  }

  private addExactMatches(
    where: Prisma.AssetWhereInput,
    searchParams: AssetSearchDto,
  ): void {
    if (searchParams.status) {
      where.status = searchParams.status;
    }
    if (searchParams.condition) {
      where.condition = searchParams.condition;
    }
    if (searchParams.projectId) {
      where.projectId = searchParams.projectId;
    }
  }

  private addStringFilters(
    where: Prisma.AssetWhereInput,
    searchParams: AssetSearchDto,
  ): void {
    const stringFilters = [
      { param: searchParams.manufacturer, field: 'manufacturer' },
      { param: searchParams.buildingName, field: 'buildingName' },
      { param: searchParams.floor, field: 'floor' },
      { param: searchParams.roomNumber, field: 'roomNumber' },
      { param: searchParams.trade, field: 'trade' },
      { param: searchParams.assetCategory, field: 'assetCategory' },
      { param: searchParams.assetType, field: 'assetType' },
      { param: searchParams.customerName, field: 'customerName' },
      { param: searchParams.propertyName, field: 'propertyName' },
    ];

    stringFilters.forEach(({ param, field }) => {
      if (param) {
        (where as Record<string, unknown>)[field] = {
          contains: param,
          mode: 'insensitive',
        };
      }
    });
  }

  private addDateRangeFilters(
    where: Prisma.AssetWhereInput,
    searchParams: AssetSearchDto,
  ): void {
    this.addInstallDateRange(where, searchParams);
    this.addWarrantyDateRange(where, searchParams);
  }

  private addInstallDateRange(
    where: Prisma.AssetWhereInput,
    searchParams: AssetSearchDto,
  ): void {
    if (searchParams.installDateFrom || searchParams.installDateTo) {
      where.installDate = {};
      if (searchParams.installDateFrom) {
        where.installDate.gte = new Date(searchParams.installDateFrom);
      }
      if (searchParams.installDateTo) {
        where.installDate.lte = new Date(searchParams.installDateTo);
      }
    }
  }

  private addWarrantyDateRange(
    where: Prisma.AssetWhereInput,
    searchParams: AssetSearchDto,
  ): void {
    if (searchParams.warrantyExpiringFrom || searchParams.warrantyExpiringTo) {
      where.warrantyExpirationDate = {};
      if (searchParams.warrantyExpiringFrom) {
        where.warrantyExpirationDate.gte = new Date(
          searchParams.warrantyExpiringFrom,
        );
      }
      if (searchParams.warrantyExpiringTo) {
        where.warrantyExpirationDate.lte = new Date(
          searchParams.warrantyExpiringTo,
        );
      }
    }
  }

  private addCostRangeFilters(
    where: Prisma.AssetWhereInput,
    searchParams: AssetSearchDto,
  ): void {
    if (
      searchParams.purchaseCostMin !== undefined ||
      searchParams.purchaseCostMax !== undefined
    ) {
      where.purchaseCost = {};
      if (searchParams.purchaseCostMin !== undefined) {
        where.purchaseCost.gte = searchParams.purchaseCostMin;
      }
      if (searchParams.purchaseCostMax !== undefined) {
        where.purchaseCost.lte = searchParams.purchaseCostMax;
      }
    }
  }

  private buildOrderBy(
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ): Prisma.AssetOrderByWithRelationInput {
    const validSortFields = [
      'name',
      'assetTag',
      'manufacturer',
      'installDate',
      'purchaseDate',
      'purchaseCost',
      'created_at',
    ];

    const field = validSortFields.includes(sortBy || '')
      ? sortBy
      : 'created_at';
    const direction = sortOrder === 'asc' ? 'asc' : 'desc';

    return { [field!]: direction };
  }

  public async findManyByIds(ids: string[]): Promise<Asset[]> {
    return this.prisma.asset.findMany({
      where: {
        id: { in: ids },
        is_deleted: false,
      },
    });
  }

  public async countByStatus(): Promise<Record<string, number>> {
    const result = await this.prisma.asset.groupBy({
      by: ['status'],
      where: { is_deleted: false },
      _count: { id: true },
    });

    return result.reduce(
      (acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  public async countByCondition(): Promise<Record<string, number>> {
    const result = await this.prisma.asset.groupBy({
      by: ['condition'],
      where: { is_deleted: false },
      _count: { id: true },
    });

    return result.reduce(
      (acc, item) => {
        acc[item.condition] = item._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  public async getAssetSummary(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byCondition: Record<string, number>;
    averageCost: number;
    totalValue: number;
  }> {
    const cacheKey = 'asset:summary:v1';
    const cached = this.getCachedSummary(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.computeAssetSummary();
    this.setCachedSummary(cacheKey, result);
    return result;
  }

  private getCachedSummary(cacheKey: string):
    | {
        total: number;
        byStatus: Record<string, number>;
        byCondition: Record<string, number>;
        averageCost: number;
        totalValue: number;
      }
    | undefined {
    const cached = this.cache.get<{
      total: number;
      byStatus: Record<string, number>;
      byCondition: Record<string, number>;
      averageCost: number;
      totalValue: number;
    }>(cacheKey);

    if (cached) {
      this.logger.log('Cache HIT for asset summary');
    }
    return cached || undefined;
  }

  private async computeAssetSummary(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byCondition: Record<string, number>;
    averageCost: number;
    totalValue: number;
  }> {
    this.logger.log(
      'Cache MISS for asset summary - performing expensive queries',
    );
    const startTime = Date.now();

    const [total, byStatus, byCondition, costStats] = await Promise.all([
      this.prisma.asset.count({ where: { is_deleted: false } }),
      this.countByStatus(),
      this.countByCondition(),
      this.getCostStatistics(),
    ]);

    const result = {
      total,
      byStatus,
      byCondition,
      averageCost: Number(costStats._avg.purchaseCost) || 0,
      totalValue: Number(costStats._sum.purchaseCost) || 0,
    };

    const queryTime = Date.now() - startTime;
    this.logger.log(`Asset summary query took ${queryTime}ms`);
    return result;
  }

  private async getCostStatistics(): Promise<{
    _avg: { purchaseCost: number | null };
    _sum: { purchaseCost: number | null };
  }> {
    const result = await this.prisma.asset.aggregate({
      where: { is_deleted: false, purchaseCost: { not: null } },
      _avg: { purchaseCost: true },
      _sum: { purchaseCost: true },
    });

    return {
      _avg: {
        purchaseCost: result._avg.purchaseCost
          ? Number(result._avg.purchaseCost)
          : null,
      },
      _sum: {
        purchaseCost: result._sum.purchaseCost
          ? Number(result._sum.purchaseCost)
          : null,
      },
    };
  }

  private setCachedSummary(
    cacheKey: string,
    result: {
      total: number;
      byStatus: Record<string, number>;
      byCondition: Record<string, number>;
      averageCost: number;
      totalValue: number;
    },
  ): void {
    this.cache.set(cacheKey, result, CACHE_CONSTANTS.SUMMARY_TTL_SECONDS);
  }
}
