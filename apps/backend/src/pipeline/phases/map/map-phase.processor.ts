import { Injectable, Logger } from '@nestjs/common';
import { PipelinePhase, AssetStatus, AssetCondition } from '@prisma/client';
import {
  PhaseProcessor,
  PhaseContext,
  PhaseResult,
  PhaseInputData,
  AssetRowData,
  FIELD_NAMES,
  PhaseMetrics,
  PhaseDebugInfo,
} from '../../orchestrator/phase-processor.interface';

// Database field mapping
const CSV_TO_DB_MAPPING: Record<string, string> = {
  [FIELD_NAMES.ASSET_TAG]: 'assetTag',
  [FIELD_NAMES.ASSET_NAME]: 'name',
  [FIELD_NAMES.STATUS]: 'status',
  [FIELD_NAMES.CONDITION]: 'condition',
  [FIELD_NAMES.MANUFACTURER]: 'manufacturer',
  [FIELD_NAMES.MODEL]: 'modelNumber',
  [FIELD_NAMES.SERIAL]: 'serialNumber',
  [FIELD_NAMES.BUILDING]: 'buildingName',
  [FIELD_NAMES.FLOOR]: 'floor',
  [FIELD_NAMES.ROOM]: 'roomNumber',
  [FIELD_NAMES.PURCHASE_DATE]: 'purchaseDate',
  [FIELD_NAMES.PURCHASE_COST]: 'purchasePrice',
};

// Status mapping
const STATUS_MAP: Record<string, AssetStatus> = {
  ACTIVE: AssetStatus.ACTIVE,
  INACTIVE: AssetStatus.INACTIVE,
  MAINTENANCE: AssetStatus.MAINTENANCE,
  RETIRED: AssetStatus.RETIRED,
  DISPOSED: AssetStatus.DISPOSED,
  LOST: AssetStatus.LOST,
  STOLEN: AssetStatus.STOLEN,
  // Map common variations
  PENDING: AssetStatus.INACTIVE,
  RESERVED: AssetStatus.ACTIVE,
};

// Condition mapping
const CONDITION_MAP: Record<string, AssetCondition> = {
  NEW: AssetCondition.NEW,
  EXCELLENT: AssetCondition.EXCELLENT,
  GOOD: AssetCondition.GOOD,
  FAIR: AssetCondition.FAIR,
  POOR: AssetCondition.POOR,
  FOR_REPAIR: AssetCondition.FOR_REPAIR,
  FOR_DISPOSAL: AssetCondition.FOR_DISPOSAL,
  // Map common variations
  REQUIRES_REPAIR: AssetCondition.FOR_REPAIR,
  OBSOLETE: AssetCondition.FOR_DISPOSAL,
};

interface MappedAssetData {
  assetTag?: string;
  name?: string;
  status?: AssetStatus;
  condition?: AssetCondition;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  buildingName?: string;
  floor?: string;
  roomNumber?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  id?: string;
  created_at?: Date;
  updated_at?: Date;
}

@Injectable()
export class MapPhaseProcessor implements PhaseProcessor {
  public readonly phase = PipelinePhase.MAP;
  public readonly name = 'Field Mapper';
  public readonly description = 'Maps CSV fields to database schema';

  private readonly logger = new Logger(MapPhaseProcessor.name);

  /**
   * Main process method - orchestrates mapping
   */
  public process(
    data: PhaseInputData,
    context: PhaseContext,
  ): Promise<PhaseResult> {
    const startTime = new Date();
    this.logger.debug(`[${context.correlationId}] Starting MAP phase`);

    try {
      // Get input rows
      const inputRows = this.getInputRows(data);

      // Map all rows
      const mappedRows = this.mapAllRows(inputRows);

      // Build result
      return Promise.resolve(
        this.buildPhaseResult(data, mappedRows, startTime, context),
      );
    } catch (error) {
      return Promise.resolve(this.buildErrorResult(error, startTime, context));
    }
  }

  /**
   * Get input rows from previous phase
   */
  private getInputRows(data: PhaseInputData): AssetRowData[] {
    // Try different sources in order of preference
    const rows =
      data.transformedRows ||
      data.cleanedRows ||
      data.validRows ||
      data.rows ||
      [];

    if (!Array.isArray(rows)) {
      throw new Error('Invalid input: expected array of rows');
    }

    return rows;
  }

  /**
   * Map all rows to database schema
   */
  private mapAllRows(rows: AssetRowData[]): MappedAssetData[] {
    const mappedRows: MappedAssetData[] = [];

    for (const row of rows) {
      const mappedRow = this.mapSingleRow(row);
      mappedRows.push(mappedRow);
    }

    return mappedRows;
  }

  /**
   * Map a single row
   */
  private mapSingleRow(row: AssetRowData): MappedAssetData {
    // Map CSV fields to database fields
    const mappedData = this.mapCsvFieldsToDatabase(row);

    // Map enum values
    this.mapEnumValues(mappedData, row);

    // Add system fields
    this.addSystemFields(mappedData);

    return mappedData;
  }

  /**
   * Map CSV field names to database field names
   */
  private mapCsvFieldsToDatabase(row: AssetRowData): MappedAssetData {
    const mappedData: MappedAssetData = {};

    for (const [csvField, dbField] of Object.entries(CSV_TO_DB_MAPPING)) {
      const value = row[csvField];
      if (value !== undefined && value !== null && value !== '') {
        (mappedData as Record<string, unknown>)[dbField] = value;
      }
    }

    return mappedData;
  }

  /**
   * Map enum values (status, condition)
   */
  private mapEnumValues(mapped: MappedAssetData, row: AssetRowData): void {
    this.mapStatusEnum(mapped, row);
    this.mapConditionEnum(mapped, row);
    this.convertDates(mapped);
    this.convertNumericValues(mapped);
  }

  private mapStatusEnum(mapped: MappedAssetData, row: AssetRowData): void {
    const statusValue = row[FIELD_NAMES.STATUS];
    if (statusValue) {
      const normalizedStatus = statusValue.trim().toUpperCase();
      mapped.status = STATUS_MAP[normalizedStatus] || AssetStatus.ACTIVE;
    } else {
      mapped.status = AssetStatus.ACTIVE;
    }
  }

  private mapConditionEnum(mapped: MappedAssetData, row: AssetRowData): void {
    const conditionValue = row[FIELD_NAMES.CONDITION];
    if (conditionValue) {
      const normalizedCondition = conditionValue.trim().toUpperCase();
      mapped.condition =
        CONDITION_MAP[normalizedCondition] || AssetCondition.GOOD;
    } else {
      mapped.condition = AssetCondition.GOOD;
    }
  }

  private convertDates(mapped: MappedAssetData): void {
    if (mapped.purchaseDate) {
      const dateStr = String(mapped.purchaseDate);
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        mapped.purchaseDate = date;
      } else {
        delete mapped.purchaseDate;
      }
    }
  }

  private convertNumericValues(mapped: MappedAssetData): void {
    if (mapped.purchasePrice) {
      const price = parseFloat(String(mapped.purchasePrice));
      if (!isNaN(price)) {
        mapped.purchasePrice = price;
      } else {
        delete mapped.purchasePrice;
      }
    }
  }

  /**
   * Add system fields (timestamps, etc.)
   */
  private addSystemFields(mapped: MappedAssetData): void {
    const now = new Date();
    mapped.created_at = now;
    mapped.updated_at = now;
  }

  /**
   * Build successful phase result
   */
  private buildPhaseResult(
    inputData: PhaseInputData,
    mappedRows: MappedAssetData[],
    startTime: Date,
    context: PhaseContext,
  ): PhaseResult {
    const endTime = new Date();
    const outputData = this.createOutputData(inputData, mappedRows);

    this.logMappingCompletion(mappedRows.length, context);

    return {
      success: true,
      phase: this.phase,
      data: outputData,
      errors: [],
      warnings: [],
      metrics: this.buildMappingMetrics(startTime, endTime, mappedRows.length),
      debug: this.buildMappingDebugInfo(),
    };
  }

  private createOutputData(
    inputData: PhaseInputData,
    mappedRows: MappedAssetData[],
  ): PhaseInputData {
    return {
      ...inputData,
      mappedRows: mappedRows as unknown as AssetRowData[],
    };
  }

  private logMappingCompletion(rowCount: number, context: PhaseContext): void {
    this.logger.debug(
      `[${context.correlationId}] MAP phase completed: ${rowCount} rows mapped`,
    );
  }

  private buildMappingMetrics(
    startTime: Date,
    endTime: Date,
    rowCount: number,
  ): PhaseMetrics {
    return {
      startTime,
      endTime,
      durationMs: endTime.getTime() - startTime.getTime(),
      recordsProcessed: rowCount,
      recordsSuccess: rowCount,
      recordsFailed: 0,
    };
  }

  private buildMappingDebugInfo(): PhaseDebugInfo {
    const MAX_DEBUG_TRANSFORMATIONS = 5;
    return {
      transformations: Object.entries(CSV_TO_DB_MAPPING)
        .map(([csv, db]) => ({
          field: csv,
          before: csv,
          after: db,
        }))
        .slice(0, MAX_DEBUG_TRANSFORMATIONS),
    };
  }

  /**
   * Build error result
   */
  private buildErrorResult(
    error: unknown,
    startTime: Date,
    context: PhaseContext,
  ): PhaseResult {
    const endTime = new Date();
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    this.logger.error(
      `[${context.correlationId}] MAP phase failed: ${errorMessage}`,
    );

    return {
      success: false,
      phase: this.phase,
      errors: [errorMessage],
      warnings: [],
      metrics: {
        startTime,
        endTime,
        durationMs: endTime.getTime() - startTime.getTime(),
        recordsProcessed: 0,
        recordsSuccess: 0,
        recordsFailed: 0,
      },
    };
  }
}
