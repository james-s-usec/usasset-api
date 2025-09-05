import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AssetStatus, AssetCondition, Prisma } from '@prisma/client';
import { ProcessedRow } from '../interfaces/pipeline-types';

@Injectable()
export class PipelineImportService {
  private readonly logger = new Logger(PipelineImportService.name);

  public constructor(private readonly prisma: PrismaService) {}

  public async getStagingData(
    jobId: string,
    limit?: number,
  ): Promise<Record<string, unknown>[]> {
    const data = await this.prisma.stagingAsset.findMany({
      where: { importJobId: jobId },
      take: limit,
      orderBy: { rowNumber: 'asc' },
    });

    // Convert Json fields to plain objects
    return data.map((item) => ({
      ...item,
      rawData: item.rawData as Record<string, unknown>,
      mappedData: item.mappedData as Record<string, unknown>,
    }));
  }

  public async saveStagingData(
    jobId: string,
    rows: ProcessedRow[],
  ): Promise<number> {
    const stagingRecords = rows.map((row, index) => ({
      importJobId: jobId,
      rowNumber: index + 1,
      rawData: row,
      mappedData: {},
      isValid: true, // Will be updated during validation
    }));

    const result = await this.prisma.stagingAsset.createMany({
      data: stagingRecords,
    });

    return result.count;
  }

  public async clearStagingData(jobId: string): Promise<void> {
    await this.prisma.stagingAsset.deleteMany({
      where: { importJobId: jobId },
    });
  }

  public async createAssetFromStaging(stagingData: {
    data: ProcessedRow;
  }): Promise<{ success: boolean; asset?: unknown; error?: string }> {
    const assetData = this.mapStagingToAsset(stagingData.data);
    return this.createAsset(assetData);
  }

  private mapStagingToAsset(data: ProcessedRow): Prisma.AssetCreateInput {
    return {
      assetTag: this.getFieldValue(data, 'assetTag', 'Asset Tag'),
      name: this.getFieldValue(data, 'name', 'Asset Name'),
      manufacturer: this.getFieldValue(data, 'manufacturer', 'Manufacturer'),
      modelNumber: this.getFieldValue(data, 'modelNumber', 'Model'),
      serialNumber: this.getFieldValue(data, 'serialNumber', 'Serial Number'),
      status: this.mapStatus(this.getFieldValue(data, 'status', 'Status')),
      condition: this.mapCondition(
        this.getFieldValue(data, 'condition', 'Condition'),
      ),
      location: this.getFieldValue(data, 'location', 'Location'),
      // department field doesn't exist in Asset model
      // assignedTo doesn't exist in Asset model
      purchaseDate: this.parseDate(
        this.getFieldValue(data, 'purchaseDate', 'Purchase Date'),
      ),
      purchasePrice: this.parseNumber(
        this.getFieldValue(data, 'purchasePrice', 'Purchase Price'),
      ),
      warrantyExpiration: this.parseDate(
        this.getFieldValue(data, 'warrantyExpiration', 'Warranty Expiration'),
      ),
      notes: this.getFieldValue(data, 'notes', 'Notes'),
      project_id: String(
        data.project_id || '00000000-0000-0000-0000-000000000000',
      ),
    };
  }

  private getFieldValue(
    data: ProcessedRow,
    field1: string,
    field2: string,
  ): string {
    const value = data[field1] || data[field2];
    return value ? String(value) : '';
  }

  private async createAsset(
    assetData: Prisma.AssetCreateInput,
  ): Promise<{ success: boolean; asset?: unknown; error?: string }> {
    try {
      const asset = await this.prisma.asset.create({ data: assetData });
      return { success: true, asset };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create asset';
      return { success: false, error: message };
    }
  }

  public async updateStagingValidity(
    stagingIds: string[],
    isValid: boolean,
    errors?: string[],
  ): Promise<void> {
    await this.prisma.stagingAsset.updateMany({
      where: { id: { in: stagingIds } },
      data: {
        isValid,
        validationErrors: errors || [],
      },
    });
  }

  private mapStatus(status: string | undefined): AssetStatus {
    if (!status) return AssetStatus.ACTIVE;
    const upperStatus = status.toUpperCase();
    return (
      AssetStatus[upperStatus as keyof typeof AssetStatus] || AssetStatus.ACTIVE
    );
  }

  private mapCondition(condition: string | undefined): AssetCondition {
    if (!condition) return AssetCondition.GOOD;
    const upperCondition = condition.toUpperCase();
    return (
      AssetCondition[upperCondition as keyof typeof AssetCondition] ||
      AssetCondition.GOOD
    );
  }

  private parseDate(value: string): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  private parseNumber(value: string): number | null {
    if (!value) return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
}
