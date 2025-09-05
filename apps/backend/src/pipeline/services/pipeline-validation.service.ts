import { Injectable, Logger } from '@nestjs/common';
import { PipelineRepository } from '../repositories/pipeline.repository';
import { ProcessedRow, ValidationResult } from '../interfaces/pipeline-types';
import { CsvParserService } from './csv-parser.service';

interface StagingAsset {
  row_number: number;
  is_valid: boolean;
  will_import: boolean;
  raw_data: Record<string, unknown>;
  mapped_data: Record<string, unknown>;
  validation_errors: string[] | null;
}

const CONSTANTS = {
  VALIDATION_SAMPLE_SIZE: 50,
  MIN_REQUIRED_COLUMNS: 2,
  MAX_SAMPLE_ERRORS: 5,
  MAX_SAMPLE_WARNINGS: 5,
  MAX_DISPLAY_ERRORS: 20,
  PREVIEW_LIMIT: 100,
  MAX_STRING_LENGTH: 50,
  MAX_LONG_STRING: 200,
};

/**
 * Pipeline Validation Service
 * Handles business logic for validating CSV data and mapping
 * Following Rule #1: Services only contain business rules - no data access
 */
@Injectable()
export class PipelineValidationService {
  private readonly logger = new Logger(PipelineValidationService.name);

  public constructor(
    private readonly pipelineRepository: PipelineRepository,
    private readonly csvParser: CsvParserService,
  ) {}

  /**
   * Validate CSV file structure and content without importing
   */
  public async validateCsvFile(fileId: string): Promise<
    ValidationResult & {
      totalRows: number;
      sampleValidData: Array<{
        rowNumber: number;
        rawData: Record<string, string>;
        mappedData: Record<string, string>;
      }>;
      sampleInvalidData: Array<{
        rowNumber: number;
        rawData: Record<string, string>;
        errors: string[];
      }>;
    }
  > {
    this.logger.debug(`Validating CSV file: ${fileId}`);

    // Parse CSV file
    const parseResult = await this.csvParser.parseFileFromBlob(fileId);

    // Check for parsing errors
    if (this.hasParsingErrors(parseResult)) {
      return this.createEmptyValidationResult(parseResult.errors);
    }

    // Process sample rows
    const sampleResult = this.processSampleRows(
      parseResult.rows,
      parseResult.errors,
    );

    // Calculate statistics for logging
    this.calculateStatistics(sampleResult, parseResult.rows.length);

    // Build result
    return this.buildValidationResult(sampleResult, parseResult.rows.length);
  }

  /**
   * Check if parsing has critical errors
   */
  private hasParsingErrors(parseResult: {
    errors: string[];
    rows: Record<string, string>[];
  }): boolean {
    return parseResult.errors.length > 0 && parseResult.rows.length === 0;
  }

  /**
   * Create empty validation result for parsing errors
   */
  private createEmptyValidationResult(errors: string[]): ValidationResult & {
    totalRows: number;
    sampleValidData: Array<{
      rowNumber: number;
      rawData: Record<string, string>;
      mappedData: Record<string, string>;
    }>;
    sampleInvalidData: Array<{
      rowNumber: number;
      rawData: Record<string, string>;
      errors: string[];
    }>;
  } {
    return {
      isValid: false,
      errors,
      warnings: [],
      validRows: [],
      invalidRows: [],
      totalRows: 0,
      sampleValidData: [],
      sampleInvalidData: [],
    };
  }

  /**
   * Process sample of rows for validation
   */
  private processSampleRows(
    rows: Record<string, string>[],
    parseErrors: string[],
  ): {
    validData: Array<{
      rowNumber: number;
      rawData: Record<string, string>;
      mappedData: Record<string, string>;
    }>;
    invalidData: Array<{
      rowNumber: number;
      rawData: Record<string, string>;
      errors: string[];
    }>;
    validRows: ProcessedRow[];
    invalidRows: ProcessedRow[];
    allErrors: string[];
  } {
    const result = this.initializeSampleResult(parseErrors);
    const sampleSize = Math.min(rows.length, CONSTANTS.VALIDATION_SAMPLE_SIZE);

    for (let i = 0; i < sampleSize; i++) {
      const row = rows[i];
      const rowNumber = i + CONSTANTS.MIN_REQUIRED_COLUMNS;
      this.processRow(row, rowNumber, result);
    }

    return result;
  }

  private initializeSampleResult(parseErrors: string[]) {
    return {
      validData: [] as Array<{
        rowNumber: number;
        rawData: Record<string, string>;
        mappedData: Record<string, string>;
      }>,
      invalidData: [] as Array<{
        rowNumber: number;
        rawData: Record<string, string>;
        errors: string[];
      }>,
      validRows: [] as ProcessedRow[],
      invalidRows: [] as ProcessedRow[],
      allErrors: [...parseErrors],
    };
  }

  /**
   * Process a single row
   */
  private processRow(
    row: Record<string, string>,
    rowNumber: number,
    result: {
      validData: Array<{
        rowNumber: number;
        rawData: Record<string, string>;
        mappedData: Record<string, string>;
      }>;
      invalidData: Array<{
        rowNumber: number;
        rawData: Record<string, string>;
        errors: string[];
      }>;
      validRows: ProcessedRow[];
      invalidRows: ProcessedRow[];
      allErrors: string[];
    },
  ): void {
    try {
      const assetData = this.mapRowToAsset(row);
      const validationErrors = this.validateAssetData(assetData);
      const processedRow: ProcessedRow = { ...assetData };

      if (validationErrors.length === 0) {
        this.handleValidRow(processedRow, row, rowNumber, assetData, result);
      } else {
        this.handleInvalidRow(
          processedRow,
          row,
          rowNumber,
          validationErrors,
          result,
        );
      }
    } catch (error) {
      this.handleRowError(error, row, rowNumber, result);
    }
  }

  private handleValidRow(
    processedRow: ProcessedRow,
    row: Record<string, string>,
    rowNumber: number,
    assetData: Record<string, string>,
    result: {
      validData: Array<{
        rowNumber: number;
        rawData: Record<string, string>;
        mappedData: Record<string, string>;
      }>;
      validRows: ProcessedRow[];
    },
  ): void {
    result.validRows.push(processedRow);
    if (result.validData.length < CONSTANTS.MAX_SAMPLE_ERRORS) {
      result.validData.push({
        rowNumber,
        rawData: row,
        mappedData: assetData,
      });
    }
  }

  private handleInvalidRow(
    processedRow: ProcessedRow,
    row: Record<string, string>,
    rowNumber: number,
    validationErrors: string[],
    result: {
      invalidData: Array<{
        rowNumber: number;
        rawData: Record<string, string>;
        errors: string[];
      }>;
      invalidRows: ProcessedRow[];
      allErrors: string[];
    },
  ): void {
    result.invalidRows.push(processedRow);
    if (result.invalidData.length < CONSTANTS.MAX_SAMPLE_WARNINGS) {
      result.invalidData.push({
        rowNumber,
        rawData: row,
        errors: validationErrors,
      });
    }
    result.allErrors.push(`Row ${rowNumber}: ${validationErrors.join(', ')}`);
  }

  /**
   * Handle row processing error
   */
  private handleRowError(
    error: unknown,
    row: Record<string, string>,
    rowNumber: number,
    result: {
      invalidData: Array<{
        rowNumber: number;
        rawData: Record<string, string>;
        errors: string[];
      }>;
      invalidRows: ProcessedRow[];
      allErrors: string[];
    },
  ): void {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const processedRow: ProcessedRow = { ...row };
    result.invalidRows.push(processedRow);

    if (result.invalidData.length < CONSTANTS.MAX_SAMPLE_ERRORS) {
      result.invalidData.push({
        rowNumber,
        rawData: row,
        errors: [errorMessage],
      });
    }
    result.allErrors.push(`Row ${rowNumber}: ${errorMessage}`);
  }

  /**
   * Calculate validation statistics
   */
  private calculateStatistics(
    sampleResult: {
      validRows: ProcessedRow[];
      invalidRows: ProcessedRow[];
    },
    totalRows: number,
  ): {
    validPercentage: number;
    estimatedValidRows: number;
    estimatedInvalidRows: number;
  } {
    const sampleSize =
      sampleResult.validRows.length + sampleResult.invalidRows.length;
    const validPercentage =
      sampleSize > 0 ? sampleResult.validRows.length / sampleSize : 0;
    const estimatedValidRows = Math.round(totalRows * validPercentage);
    const estimatedInvalidRows = totalRows - estimatedValidRows;

    this.logger.debug(
      `Validation complete: ${estimatedValidRows} valid, ${estimatedInvalidRows} invalid`,
    );

    return { validPercentage, estimatedValidRows, estimatedInvalidRows };
  }

  /**
   * Build validation result
   */
  private buildValidationResult(
    sampleResult: {
      validData: Array<{
        rowNumber: number;
        rawData: Record<string, string>;
        mappedData: Record<string, string>;
      }>;
      invalidData: Array<{
        rowNumber: number;
        rawData: Record<string, string>;
        errors: string[];
      }>;
      validRows: ProcessedRow[];
      invalidRows: ProcessedRow[];
      allErrors: string[];
    },
    totalRows: number,
  ): ValidationResult & {
    totalRows: number;
    sampleValidData: typeof sampleResult.validData;
    sampleInvalidData: typeof sampleResult.invalidData;
  } {
    return {
      isValid: sampleResult.allErrors.length === 0,
      errors: sampleResult.allErrors.slice(0, CONSTANTS.MAX_DISPLAY_ERRORS),
      warnings: [],
      validRows: sampleResult.validRows,
      invalidRows: sampleResult.invalidRows,
      totalRows,
      sampleValidData: sampleResult.validData,
      sampleInvalidData: sampleResult.invalidData,
    };
  }

  /**
   * Map CSV row to asset data structure
   */
  private mapRowToAsset(row: Record<string, string>): Record<string, string> {
    return {
      assetTag: this.getFieldValue(row, ['Asset ID', 'Asset Tag', 'ID']),
      name: this.getFieldValue(row, ['Name', 'Asset Name']),
      description: this.getFieldValue(row, ['Description']),
      buildingName: this.getFieldValue(row, ['Building']),
      floor: this.getFieldValue(row, ['Floor']),
      room: this.getFieldValue(row, ['Room']),
      status: this.getFieldValue(row, ['Status'], 'ACTIVE'),
      conditionAssessment: this.getFieldValue(row, ['Condition'], 'GOOD'),
      manufacturer: this.getFieldValue(row, ['Manufacturer']),
      modelNumber: this.getFieldValue(row, ['Model', 'Model Number']),
      serialNumber: this.getFieldValue(row, ['Serial Number', 'Serial']),
    };
  }

  /**
   * Get field value from row with fallback field names
   */
  private getFieldValue(
    row: Record<string, string>,
    fieldNames: string[],
    defaultValue = '',
  ): string {
    for (const fieldName of fieldNames) {
      if (row[fieldName]) {
        return row[fieldName];
      }
    }
    return defaultValue;
  }

  /**
   * Validate mapped asset data
   */
  private validateAssetData(assetData: Record<string, string>): string[] {
    const validationErrors: string[] = [];

    if (!assetData.assetTag) {
      validationErrors.push('Missing required field: Asset Tag');
    }
    if (!assetData.name) {
      validationErrors.push('Missing required field: Name');
    }

    // Additional validation rules would go here
    if (
      assetData.assetTag &&
      assetData.assetTag.length > CONSTANTS.MAX_STRING_LENGTH
    ) {
      validationErrors.push('Asset Tag too long (max 50 characters)');
    }
    if (assetData.name && assetData.name.length > CONSTANTS.MAX_LONG_STRING) {
      validationErrors.push(
        `Name too long (max ${CONSTANTS.MAX_LONG_STRING} characters)`,
      );
    }

    return validationErrors;
  }

  /**
   * Get staged data for job review
   */
  public async getStagedData(jobId: string): Promise<{
    data: Array<{
      rowNumber: number;
      isValid: boolean;
      willImport: boolean;
      rawData: Record<string, unknown>;
      mappedData: Record<string, unknown>;
      errors: string[] | null;
    }>;
    validCount: number;
    invalidCount: number;
  }> {
    const [stagingAssets, validCount, invalidCount] = await Promise.all([
      this.pipelineRepository.findStagingAssets(jobId, CONSTANTS.PREVIEW_LIMIT),
      this.pipelineRepository.countStagingAssets(jobId, true),
      this.pipelineRepository.countStagingAssets(jobId, false),
    ]);

    return {
      data: this.mapStagingAssets(stagingAssets),
      validCount,
      invalidCount,
    };
  }

  private mapStagingAssets(stagingAssets: unknown): Array<{
    rowNumber: number;
    isValid: boolean;
    willImport: boolean;
    rawData: Record<string, unknown>;
    mappedData: Record<string, unknown>;
    errors: string[] | null;
  }> {
    return (stagingAssets as StagingAsset[]).map((asset) => ({
      rowNumber: asset.row_number,
      isValid: asset.is_valid,
      willImport: asset.will_import,
      rawData: asset.raw_data,
      mappedData: asset.mapped_data,
      errors: asset.validation_errors,
    }));
  }
}
