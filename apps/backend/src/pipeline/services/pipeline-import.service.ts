import { Injectable, Logger } from '@nestjs/common';
import { PipelineRepository } from '../repositories/pipeline.repository';
import { AssetStatus, AssetCondition, Prisma } from '@prisma/client';
import { ImportJobResult } from '../interfaces/pipeline-types';
import { CsvParserService } from './csv-parser.service';

const CONSTANTS = {
  PREVIEW_LIMIT: 10,
  VALIDATION_SAMPLE_SIZE: 100,
  MAX_STRING_LENGTH: 200,
  MIN_ARRAY_LENGTH: 2,
};

interface MappedAssetData {
  assetTag: string;
  name: string;
  description?: string;
  buildingName?: string;
  floor?: string;
  room?: string;
  status?: string;
  conditionAssessment?: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
}

/**
 * Pipeline Import Service
 * Handles business logic for importing CSV data to assets
 * Following Rule #1: Services only contain business rules - no data access
 */
@Injectable()
export class PipelineImportService {
  private readonly logger = new Logger(PipelineImportService.name);

  public constructor(
    private readonly pipelineRepository: PipelineRepository,
    private readonly csvParser: CsvParserService,
  ) {}

  /**
   * Process import job: parse CSV, validate, create staging records
   */
  public async processImport(jobId: string, fileId: string): Promise<void> {
    try {
      await this.startImportJob(jobId);
      const parseResult = await this.csvParser.parseFileFromBlob(fileId);

      if (this.shouldFailImport(parseResult)) {
        await this.failImportJob(jobId, parseResult.errors);
        return;
      }

      await this.processAndStageData(jobId, parseResult);
    } catch (error) {
      await this.handleImportError(jobId, error);
    }
  }

  private async startImportJob(jobId: string): Promise<void> {
    await this.pipelineRepository.updateImportJob(jobId, {
      status: 'RUNNING',
    });
  }

  private shouldFailImport(parseResult: {
    errors: string[];
    rows: Record<string, string>[];
  }): boolean {
    return parseResult.errors.length > 0 && parseResult.rows.length === 0;
  }

  private async failImportJob(jobId: string, errors: string[]): Promise<void> {
    await this.pipelineRepository.updateImportJob(jobId, {
      status: 'FAILED',
      errors: errors,
      completed_at: new Date(),
    });
  }

  private async processAndStageData(
    jobId: string,
    parseResult: { errors: string[]; rows: Record<string, string>[] },
  ): Promise<void> {
    const { stagingAssets, errors, processedCount } = this.processCsvRows(
      jobId,
      parseResult.rows,
    );

    if (stagingAssets.length > 0) {
      await this.pipelineRepository.createStagingAssets(stagingAssets);
    }

    await this.completeImportJob(jobId, parseResult, processedCount, [
      ...parseResult.errors,
      ...errors,
    ]);
  }

  private async completeImportJob(
    jobId: string,
    parseResult: { rows: Record<string, string>[] },
    processedCount: number,
    allErrors: string[],
  ): Promise<void> {
    await this.pipelineRepository.updateImportJob(jobId, {
      status: 'STAGED',
      total_rows: parseResult.rows.length,
      processed_rows: processedCount,
      error_rows: parseResult.rows.length - processedCount,
      errors: allErrors,
      completed_at: new Date(),
    });

    this.logger.log(
      `Import job ${jobId} processed: ${processedCount} valid rows staged`,
    );
  }

  private async handleImportError(
    jobId: string,
    error: unknown,
  ): Promise<void> {
    this.logger.error(`Import job ${jobId} failed:`, error);
    await this.pipelineRepository.updateImportJob(jobId, {
      status: 'FAILED',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      completed_at: new Date(),
    });
  }

  /**
   * Approve and import staged data to assets table
   */
  public async approveImport(jobId: string): Promise<ImportJobResult> {
    this.logger.debug(`Approving import for job: ${jobId}`);

    const validAssets = await this.getValidStagedAssets(jobId);
    if (validAssets.length === 0) {
      return this.createEmptyResult(jobId);
    }

    const assets = this.convertToAssetRecords(validAssets);
    const importResult = await this.importAssets(assets);

    await this.finalizeImport(jobId, assets.length, importResult);

    return this.createImportResult(
      jobId,
      assets.length,
      importResult.successCount,
      importResult.errors,
    );
  }

  private async getValidStagedAssets(jobId: string): Promise<
    Array<{
      is_valid: boolean;
      will_import: boolean;
      row_number: number;
      mapped_data: unknown;
    }>
  > {
    const allAssets = await this.pipelineRepository.findStagingAssets(jobId);
    return allAssets.filter((asset) => asset.is_valid && asset.will_import);
  }

  private createEmptyResult(jobId: string): ImportJobResult {
    return {
      jobId,
      status: 'completed',
      stats: { total: 0, successful: 0, failed: 0, skipped: 0 },
      errors: ['No valid assets to import'],
    };
  }

  private convertToAssetRecords(
    stagedAssets: Array<{ row_number: number; mapped_data: unknown }>,
  ): Array<Record<string, unknown>> {
    return stagedAssets.map((staged) => this.createAssetRecord(staged));
  }

  // Reduced complexity by extracting defaults
  private createAssetRecord(staged: {
    row_number: number;
    mapped_data: unknown;
  }): Record<string, unknown> {
    const data = staged.mapped_data as MappedAssetData;
    const defaults = this.getAssetDefaults(staged.row_number);
    return this.buildAssetRecord(data, defaults);
  }

  private getAssetDefaults(rowNumber: number): {
    assetTag: string;
    name: string;
    status: AssetStatus;
    condition: AssetCondition;
  } {
    return {
      assetTag: `IMPORT-${rowNumber}`,
      name: 'Unnamed Asset',
      status: AssetStatus.ACTIVE,
      condition: AssetCondition.GOOD,
    };
  }

  private buildAssetRecord(
    data: MappedAssetData,
    defaults: {
      assetTag: string;
      name: string;
      status: AssetStatus;
      condition: AssetCondition;
    },
  ): Record<string, unknown> {
    const basicInfo = this.getBasicInfo(data, defaults);
    const locationInfo = this.getLocationInfo(data);
    const techSpecs = this.getTechSpecs(data);
    const statusInfo = this.getStatusInfo(data, defaults);

    return {
      ...basicInfo,
      ...locationInfo,
      ...techSpecs,
      ...statusInfo,
    };
  }

  private getBasicInfo(
    data: MappedAssetData,
    defaults: { assetTag: string; name: string },
  ): Record<string, unknown> {
    return {
      assetTag: data.assetTag || defaults.assetTag,
      name: data.name || defaults.name,
      description: data.description || null,
    };
  }

  private getLocationInfo(data: MappedAssetData): Record<string, unknown> {
    return {
      buildingName: data.buildingName || null,
      floor: data.floor || null,
      roomNumber: data.room || null,
    };
  }

  private getTechSpecs(data: MappedAssetData): Record<string, unknown> {
    return {
      manufacturer: data.manufacturer || null,
      modelNumber: data.modelNumber || null,
      serialNumber: data.serialNumber || null,
    };
  }

  private getStatusInfo(
    data: MappedAssetData,
    defaults: { status: AssetStatus; condition: AssetCondition },
  ): Record<string, unknown> {
    return {
      status: (data.status as AssetStatus) || defaults.status,
      condition:
        (data.conditionAssessment as AssetCondition) || defaults.condition,
    };
  }

  private async importAssets(
    assets: Array<Record<string, unknown>>,
  ): Promise<{ successCount: number; errors: string[] }> {
    const bulkResult = await this.tryBulkInsert(assets);
    if (bulkResult.success) {
      return bulkResult;
    }

    return await this.insertIndividually(assets);
  }

  private async tryBulkInsert(
    assets: Array<Record<string, unknown>>,
  ): Promise<{ success: boolean; successCount: number; errors: string[] }> {
    try {
      const typedAssets = assets as Prisma.AssetCreateManyInput[];
      const result = await this.pipelineRepository.createAssets(typedAssets);
      this.logger.log(`Bulk insert successful: ${result.count} assets created`);
      return { success: true, successCount: result.count, errors: [] };
    } catch {
      this.logger.warn(
        'Bulk insert failed, falling back to individual inserts',
      );
      return { success: false, successCount: 0, errors: [] };
    }
  }

  private async insertIndividually(
    assets: Array<Record<string, unknown>>,
  ): Promise<{ successCount: number; errors: string[] }> {
    let successCount = 0;
    const errors: string[] = [];
    const prisma = this.pipelineRepository.getPrismaClient();

    for (const asset of assets) {
      try {
        const assetData = asset as Prisma.AssetCreateInput;
        await prisma.asset.create({ data: assetData });
        successCount++;
      } catch (error) {
        const msg = this.formatInsertError(asset, error);
        errors.push(msg);
        this.logger.error(msg);
      }
    }

    return { successCount, errors };
  }

  private formatInsertError(
    asset: Record<string, unknown>,
    error: unknown,
  ): string {
    const assetTag = asset.assetTag as string;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return `Failed to insert ${assetTag}: ${errorMsg}`;
  }

  private async finalizeImport(
    jobId: string,
    totalAssets: number,
    importResult: { successCount: number },
  ): Promise<void> {
    await this.pipelineRepository.updateImportJob(jobId, {
      status: 'COMPLETED',
      completed_at: new Date(),
    });

    await this.pipelineRepository.deleteStagingAssetsByJob(jobId);

    this.logger.log(
      `Import approved for job ${jobId}: ${importResult.successCount} assets imported`,
    );
  }

  private createImportResult(
    jobId: string,
    total: number,
    successful: number,
    errors: string[],
  ): ImportJobResult {
    return {
      jobId,
      status: 'completed',
      stats: {
        total,
        successful,
        failed: total - successful,
        skipped: 0,
      },
      errors,
    };
  }

  /**
   * Reject and clear staged data
   */
  public async rejectImport(jobId: string): Promise<{ clearedCount: number }> {
    this.logger.debug(`Rejecting import for job: ${jobId}`);

    // Clear staging data
    const result =
      await this.pipelineRepository.deleteStagingAssetsByJob(jobId);
    const clearedCount = result.count;

    // Update job status to failed
    await this.pipelineRepository.updateImportJob(jobId, {
      status: 'FAILED',
      errors: ['Import rejected by user'],
      completed_at: new Date(),
    });

    this.logger.log(
      `Import rejected for job ${jobId}: ${clearedCount} staging records cleared`,
    );

    return { clearedCount };
  }

  /**
   * Preview CSV file without processing
   */
  public async previewCsvFile(fileId: string): Promise<{
    data: Record<string, string>[];
    columns: string[];
    totalRows: number;
  }> {
    const parseResult = await this.csvParser.parseFileFromBlob(fileId);

    // Limit preview to first 10 rows and truncate long values
    const previewData = parseResult.rows
      .slice(0, CONSTANTS.PREVIEW_LIMIT)
      .map((row) => {
        const truncatedRow: Record<string, string> = {};
        for (const [key, value] of Object.entries(row)) {
          truncatedRow[key] =
            typeof value === 'string' &&
            value.length > CONSTANTS.VALIDATION_SAMPLE_SIZE
              ? value.substring(0, CONSTANTS.VALIDATION_SAMPLE_SIZE) + '...'
              : value;
        }
        return truncatedRow;
      });

    const columns = previewData.length > 0 ? Object.keys(previewData[0]) : [];

    return {
      data: previewData,
      columns,
      totalRows: parseResult.rows.length,
    };
  }

  /**
   * Process CSV rows into staging records
   */
  private processCsvRows(
    jobId: string,
    rows: Record<string, string>[],
  ): {
    stagingAssets: Prisma.StagingAssetCreateManyInput[];
    errors: string[];
    processedCount: number;
  } {
    const result = {
      stagingAssets: [] as Prisma.StagingAssetCreateManyInput[],
      errors: [] as string[],
      processedCount: 0,
    };

    rows.forEach((row, index) => {
      this.processRow(jobId, row, index, result);
    });

    return result;
  }

  private processRow(
    jobId: string,
    row: Record<string, string>,
    index: number,
    result: {
      stagingAssets: Prisma.StagingAssetCreateManyInput[];
      errors: string[];
      processedCount: number;
    },
  ): void {
    const HEADER_ROW_OFFSET = 2;
    const rowNumber = index + HEADER_ROW_OFFSET;

    try {
      const stagingRecord = this.createStagingRecord(
        jobId,
        row,
        rowNumber,
        result,
      );
      result.stagingAssets.push(stagingRecord);
    } catch (error) {
      result.errors.push(this.formatRowError(rowNumber, error));
    }
  }

  private createStagingRecord(
    jobId: string,
    row: Record<string, string>,
    rowNumber: number,
    result: { processedCount: number; errors: string[] },
  ): Prisma.StagingAssetCreateManyInput {
    const assetData = this.mapRowToAsset(row);
    const validationErrors = this.validateAssetData(assetData);
    const isValid = validationErrors.length === 0;

    if (isValid) {
      result.processedCount++;
    } else {
      result.errors.push(`Row ${rowNumber}: ${validationErrors.join(', ')}`);
    }

    return {
      import_job_id: jobId,
      row_number: rowNumber,
      raw_data: this.truncateRowData(row) as Prisma.InputJsonValue,
      mapped_data: assetData as unknown as Prisma.InputJsonValue,
      validation_errors: this.formatValidationErrors(validationErrors),
      is_valid: isValid,
      will_import: isValid,
    };
  }

  private truncateRowData(row: Record<string, string>): Record<string, string> {
    const truncated: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      truncated[key] = this.truncateString(value);
    }
    return truncated;
  }

  private truncateString(value: string): string {
    if (typeof value !== 'string') {
      return value;
    }
    if (value.length > CONSTANTS.MAX_STRING_LENGTH) {
      return value.substring(0, CONSTANTS.MAX_STRING_LENGTH) + '...';
    }
    return value;
  }

  private formatValidationErrors(
    errors: string[],
  ): Prisma.InputJsonValue | undefined {
    return errors.length > 0 ? (errors as Prisma.InputJsonValue) : undefined;
  }

  private formatRowError(rowNumber: number, error: unknown): string {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return `Row ${rowNumber}: Failed to process - ${message}`;
  }

  /**
   * Map CSV row to asset data
   */
  private mapRowToAsset(row: Record<string, string>): MappedAssetData {
    return {
      assetTag: this.extractAssetTag(row),
      name: this.extractName(row),
      description: row['Description'],
      buildingName: row['Building'],
      floor: row['Floor'],
      room: row['Room'],
      status: row['Status'] || 'ACTIVE',
      conditionAssessment: row['Condition'] || 'GOOD',
      manufacturer: row['Manufacturer'],
      modelNumber: this.extractModelNumber(row),
      serialNumber: this.extractSerialNumber(row),
    };
  }

  private extractAssetTag(row: Record<string, string>): string {
    return row['Asset ID'] || row['Asset Tag'] || row['ID'] || '';
  }

  private extractName(row: Record<string, string>): string {
    return row['Name'] || row['Asset Name'] || '';
  }

  private extractModelNumber(row: Record<string, string>): string | undefined {
    return row['Model'] || row['Model Number'];
  }

  private extractSerialNumber(row: Record<string, string>): string | undefined {
    return row['Serial Number'] || row['Serial'];
  }

  /**
   * Validate mapped asset data
   */
  private validateAssetData(assetData: MappedAssetData): string[] {
    const validationErrors: string[] = [];

    if (!assetData.assetTag) {
      validationErrors.push('Missing required field: Asset Tag');
    }
    if (!assetData.name) {
      validationErrors.push('Missing required field: Name');
    }

    return validationErrors;
  }
}
