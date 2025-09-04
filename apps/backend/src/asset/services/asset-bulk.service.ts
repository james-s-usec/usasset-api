import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { BulkUpdateAssetData } from '../dto/bulk-update-asset-data.dto';
import { BulkOperationResult } from '../dto/bulk-operation-result.dto';

@Injectable()
export class AssetBulkService {
  private readonly logger = new Logger(AssetBulkService.name);

  public constructor(private readonly prisma: PrismaService) {}

  // eslint-disable-next-line max-lines-per-function
  public async bulkCreate(
    assets: CreateAssetDto[],
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      successful: 0,
      failed: 0,
      total: assets.length,
      errors: [],
      successfulIds: [],
    };

    // Use transaction for consistency
    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < assets.length; i++) {
        try {
          const asset = await tx.asset.create({
            data: assets[i],
          });
          result.successful++;
          result.successfulIds.push(asset.id);
        } catch (error) {
          result.failed++;
          result.errors.push({
            index: i,
            error: error instanceof Error ? error.message : 'Unknown error',
            field: this.extractFieldFromError(error),
          });
          this.logger.error(
            `Bulk create failed for asset at index ${i}:`,
            error,
          );
        }
      }
    });

    return result;
  }

  // eslint-disable-next-line max-lines-per-function
  public async bulkUpdate(
    updates: BulkUpdateAssetData[],
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      successful: 0,
      failed: 0,
      total: updates.length,
      errors: [],
      successfulIds: [],
    };

    // Use transaction for consistency
    // eslint-disable-next-line max-lines-per-function
    await this.prisma.$transaction(async (tx) => {
      for (const updateData of updates) {
        try {
          const { id, ...data } = updateData;

          // Check if asset exists
          const existingAsset = await tx.asset.findUnique({
            where: { id, is_deleted: false },
          });

          if (!existingAsset) {
            result.failed++;
            result.errors.push({
              id,
              error: `Asset with ID ${id} not found`,
            });
            continue;
          }

          await tx.asset.update({
            where: { id },
            data,
          });

          result.successful++;
          result.successfulIds.push(id);
        } catch (error) {
          result.failed++;
          result.errors.push({
            id: updateData.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            field: this.extractFieldFromError(error),
          });
          this.logger.error(
            `Bulk update failed for asset ${updateData.id}:`,
            error,
          );
        }
      }
    });

    return result;
  }

  // eslint-disable-next-line max-lines-per-function
  public async bulkDelete(
    ids: string[],
    hardDelete: boolean = false,
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      successful: 0,
      failed: 0,
      total: ids.length,
      errors: [],
      successfulIds: [],
    };

    // Use transaction for consistency
    // eslint-disable-next-line max-lines-per-function
    await this.prisma.$transaction(async (tx) => {
      for (const id of ids) {
        try {
          // Check if asset exists
          const existingAsset = await tx.asset.findUnique({
            where: { id, is_deleted: false },
          });

          if (!existingAsset) {
            result.failed++;
            result.errors.push({
              id,
              error: `Asset with ID ${id} not found`,
            });
            continue;
          }

          if (hardDelete) {
            await tx.asset.delete({
              where: { id },
            });
          } else {
            await tx.asset.update({
              where: { id },
              data: {
                is_deleted: true,
              },
            });
          }

          result.successful++;
          result.successfulIds.push(id);
        } catch (error) {
          result.failed++;
          result.errors.push({
            id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          this.logger.error(`Bulk delete failed for asset ${id}:`, error);
        }
      }
    });

    return result;
  }

  // eslint-disable-next-line max-lines-per-function
  public async bulkUpdateBySearch(
    searchWhere: Record<string, unknown>,
    updateData: Partial<CreateAssetDto>,
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      successful: 0,
      failed: 0,
      total: 0,
      errors: [],
      successfulIds: [],
    };

    try {
      // First, find all matching assets to get the count
      const matchingAssets = await this.prisma.asset.findMany({
        where: { ...searchWhere, is_deleted: false },
        select: { id: true },
      });

      result.total = matchingAssets.length;

      if (result.total === 0) {
        return result;
      }

      // Perform bulk update
      const updateResult = await this.prisma.asset.updateMany({
        where: { ...searchWhere, is_deleted: false },
        data: updateData,
      });

      result.successful = updateResult.count;
      result.successfulIds = matchingAssets.map((asset) => asset.id);
    } catch (error) {
      result.failed = result.total;
      result.errors.push({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      this.logger.error('Bulk update by search failed:', error);
    }

    return result;
  }

  private extractFieldFromError(error: unknown): string | undefined {
    const errorObj = error as Record<string, unknown>;

    if (this.hasMetaTarget(errorObj)) {
      return this.formatMetaTarget(errorObj.meta);
    }

    if (this.isUniqueConstraintError(errorObj)) {
      return this.extractUniqueConstraintField(errorObj.message as string);
    }

    return undefined;
  }

  private hasMetaTarget(error: Record<string, unknown>): boolean {
    return Boolean(
      error?.meta &&
        typeof error.meta === 'object' &&
        (error.meta as Record<string, unknown>)?.target !== undefined,
    );
  }

  private formatMetaTarget(meta: unknown): string {
    const target = (meta as Record<string, unknown>).target;
    return Array.isArray(target) ? target.join(', ') : String(target);
  }

  private isUniqueConstraintError(error: Record<string, unknown>): boolean {
    return (
      typeof error.message === 'string' &&
      error.message.includes('Unique constraint')
    );
  }

  private extractUniqueConstraintField(message: string): string | undefined {
    const match = message.match(/fields: \((.*?)\)/);
    return match ? match[1] : undefined;
  }
}
