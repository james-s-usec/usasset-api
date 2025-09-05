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

interface MappedField {
  csvHeader: string;
  assetField: string;
  confidence: number;
}

interface FieldMappingResult {
  mappedFields: MappedField[];
  unmappedFields: string[];
  totalCsvColumns: number;
  mappedCount: number;
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
    const { stagingAssets, errors, processedCount } = await this.processCsvRows(
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
      const transformedAssets = assets.map((asset) =>
        this.transformAssetData(asset),
      );
      const result =
        await this.pipelineRepository.createAssets(transformedAssets);
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
        const assetData = this.transformAssetData(asset);
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

  private transformAssetData(
    asset: Record<string, unknown>,
  ): Prisma.AssetCreateInput {
    const transformed = { ...asset } as Record<string, unknown>;

    // Map status values
    if (transformed.status) {
      transformed.status = this.mapStatusValue(transformed.status);
    }

    // Map condition values
    if (transformed.condition) {
      transformed.condition = this.mapConditionValue(transformed.condition);
    }

    return transformed as Prisma.AssetCreateInput;
  }

  private mapStatusValue(status: unknown): string {
    const statusMap: Record<string, string> = {
      available: 'ACTIVE',
      in_use: 'ACTIVE',
      active: 'ACTIVE',
      maintenance: 'MAINTENANCE',
      retired: 'RETIRED',
      disposed: 'DISPOSED',
      inactive: 'INACTIVE',
      lost: 'LOST',
      stolen: 'STOLEN',
    };
    const statusStr = String(status).toLowerCase();
    return statusMap[statusStr] || 'ACTIVE';
  }

  private mapConditionValue(condition: unknown): string {
    const conditionMap: Record<string, string> = {
      excellent: 'EXCELLENT',
      good: 'GOOD',
      fair: 'FAIR',
      poor: 'POOR',
      critical: 'CRITICAL',
      unknown: 'UNKNOWN',
      new: 'NEW',
    };
    const conditionStr = String(condition).toLowerCase();
    return conditionMap[conditionStr] || 'UNKNOWN';
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
   * Get field mappings for CSV import using asset column aliases
   */
  public async getFieldMappings(fileId: string): Promise<FieldMappingResult> {
    const csvHeaders = await this.extractCsvHeaders(fileId);
    const aliases = await this.pipelineRepository.getAssetColumnAliases();
    return this.matchHeadersToAliases(csvHeaders, aliases);
  }

  private async extractCsvHeaders(fileId: string): Promise<string[]> {
    const parseResult = await this.csvParser.parseFileFromBlob(fileId);
    return parseResult.rows.length > 0 ? Object.keys(parseResult.rows[0]) : [];
  }

  private matchHeadersToAliases(
    csvHeaders: string[],
    aliases: Array<{
      csv_alias: string;
      asset_field: string;
      confidence: number;
    }>,
  ): FieldMappingResult {
    const { mapped, unmapped } = this.processHeaderMappings(
      csvHeaders,
      aliases,
    );

    return {
      mappedFields: mapped.sort((a, b) => b.confidence - a.confidence),
      unmappedFields: unmapped,
      totalCsvColumns: csvHeaders.length,
      mappedCount: mapped.length,
    };
  }

  private processHeaderMappings(
    csvHeaders: string[],
    aliases: Array<{
      csv_alias: string;
      asset_field: string;
      confidence: number;
    }>,
  ): { mapped: MappedField[]; unmapped: string[] } {
    const mapped: MappedField[] = [];
    const unmapped: string[] = [];

    for (const header of csvHeaders) {
      const alias = aliases.find(
        (a) => a.csv_alias.toLowerCase() === header.toLowerCase(),
      );
      if (alias) {
        mapped.push({
          csvHeader: header,
          assetField: alias.asset_field,
          confidence: alias.confidence,
        });
      } else {
        unmapped.push(header);
      }
    }

    return { mapped, unmapped };
  }

  /**
   * Process CSV rows into staging records
   */
  private async processCsvRows(
    jobId: string,
    rows: Record<string, string>[],
  ): Promise<{
    stagingAssets: Prisma.StagingAssetCreateManyInput[];
    errors: string[];
    processedCount: number;
  }> {
    const result = {
      stagingAssets: [] as Prisma.StagingAssetCreateManyInput[],
      errors: [] as string[],
      processedCount: 0,
    };

    // Process rows sequentially to avoid overwhelming the database with concurrent requests
    for (let index = 0; index < rows.length; index++) {
      await this.processRow(jobId, rows[index], index, result);
    }

    return result;
  }

  private async processRow(
    jobId: string,
    row: Record<string, string>,
    index: number,
    result: {
      stagingAssets: Prisma.StagingAssetCreateManyInput[];
      errors: string[];
      processedCount: number;
    },
  ): Promise<void> {
    const HEADER_ROW_OFFSET = 2;
    const rowNumber = index + HEADER_ROW_OFFSET;

    try {
      const stagingRecord = await this.createStagingRecord(
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

  private async createStagingRecord(
    jobId: string,
    row: Record<string, string>,
    rowNumber: number,
    result: { processedCount: number; errors: string[] },
  ): Promise<Prisma.StagingAssetCreateManyInput> {
    const assetData = await this.mapRowToAsset(row);
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
   * Map CSV row to asset data using dynamic aliases
   */
  private async mapRowToAsset(
    row: Record<string, string>,
  ): Promise<Record<string, unknown>> {
    const aliases = await this.pipelineRepository.getAssetColumnAliases();
    const assetData: Record<string, unknown> = {};

    // Apply alias mappings
    for (const [csvColumn, csvValue] of Object.entries(row)) {
      const alias = aliases.find(
        (a) => a.csv_alias.toLowerCase() === csvColumn.toLowerCase(),
      );
      if (alias && csvValue && csvValue.trim() !== '') {
        assetData[alias.asset_field] = this.transformValue(
          csvValue,
          alias.asset_field,
        );
      }
    }

    // Apply required defaults
    return this.applyRequiredDefaults(assetData);
  }

  private transformValue(value: string, assetField: string): unknown {
    const trimmedValue = value.trim();
    if (!trimmedValue) return null;

    if (this.isDateField(assetField)) {
      return this.parseDate(trimmedValue);
    }
    if (this.isNumberField(assetField)) {
      return this.parseNumber(trimmedValue);
    }
    if (this.isIntegerField(assetField)) {
      return this.parseInteger(trimmedValue);
    }
    if (assetField === 'verified') {
      return this.parseBoolean(trimmedValue);
    }
    return trimmedValue;
  }

  private isDateField(field: string): boolean {
    const dateFields = [
      'installDate',
      'warrantyExpirationDate',
      'estimatedReplacementDate',
      'purchaseDate',
    ];
    return dateFields.includes(field);
  }

  private isNumberField(field: string): boolean {
    const numberFields = [
      'purchaseCost',
      'xCoordinate',
      'yCoordinate',
      'squareFeet',
      'motorHp',
      'observedRemainingLife',
      'serviceLife',
    ];
    return numberFields.includes(field);
  }

  private isIntegerField(field: string): boolean {
    const integerFields = ['beltQuantity', 'filterQuantity', 'quantity'];
    return integerFields.includes(field);
  }

  private parseDate(value: string): Date | null {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  private parseNumber(value: string): number | null {
    const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? null : num;
  }

  private parseInteger(value: string): number | null {
    const num = parseInt(value.replace(/[^0-9-]/g, ''), 10);
    return isNaN(num) ? null : num;
  }

  private parseBoolean(value: string): boolean {
    const lower = value.toLowerCase();
    return (
      lower === 'true' ||
      lower === 'yes' ||
      lower === '1' ||
      lower === 'verified'
    );
  }

  private applyRequiredDefaults(
    assetData: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      ...assetData,
      // Required fields with fallbacks
      assetTag: assetData.assetTag || `IMPORT-${Date.now()}`,
      name: assetData.name || 'Unnamed Asset',
      status: assetData.status || 'ACTIVE',
      condition: assetData.condition || 'GOOD',
    };
  }

  /**
   * Validate mapped asset data
   */
  private validateAssetData(assetData: Record<string, unknown>): string[] {
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
