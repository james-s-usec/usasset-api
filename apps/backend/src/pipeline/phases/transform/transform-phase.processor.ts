import { PROCESSING_CONSTANTS } from '../../constants/processing.constants';
import { Injectable, Logger } from '@nestjs/common';
import { PipelinePhase } from '@prisma/client';
import {
  PhaseProcessor,
  PhaseContext,
  PhaseResult,
  PhaseInputData,
  AssetRowData,
  PhaseMetrics,
  FIELD_NAMES,
} from '../../orchestrator/phase-processor.interface';

interface TransformationRecord {
  field: string;
  before: unknown;
  after: unknown;
}

interface TransformedRowData extends AssetRowData {
  _processedAt?: string;
  _rowIndex?: string; // Changed to string to match index signature
}

@Injectable()
export class TransformPhaseProcessor implements PhaseProcessor {
  public readonly phase = PipelinePhase.TRANSFORM;
  public readonly name = 'Data Transformer';
  public readonly description =
    'Transforms data: TO_UPPERCASE, DATE_FORMAT, CALCULATE_FIELD, etc.';

  private readonly logger = new Logger(TransformPhaseProcessor.name);

  /**
   * Main process method - orchestrates transformation
   */
  public process(
    data: PhaseInputData,
    context: PhaseContext,
  ): Promise<PhaseResult> {
    const startTime = new Date();
    this.logger.debug(`[${context.correlationId}] Starting TRANSFORM phase`);

    try {
      // Get input rows
      const inputRows = this.getInputRows(data);

      // Transform all rows
      const transformResult = this.transformAllRows(inputRows);

      // Build result
      return Promise.resolve(
        this.buildPhaseResult(data, transformResult, startTime, context),
      );
    } catch (error) {
      return Promise.resolve(this.buildErrorResult(error, startTime, context));
    }
  }

  /**
   * Get input rows from previous phase
   */
  private getInputRows(data: PhaseInputData): AssetRowData[] {
    const rows = data.cleanedRows || data.validRows || data.rows || [];

    if (!Array.isArray(rows)) {
      throw new Error('Invalid input: expected rows array from previous phase');
    }

    return rows;
  }

  /**
   * Transform all rows
   */
  private transformAllRows(rows: AssetRowData[]): {
    transformedRows: TransformedRowData[];
    transformations: TransformationRecord[];
  } {
    const transformedRows: TransformedRowData[] = [];
    const allTransformations: TransformationRecord[] = [];

    for (let i = 0; i < rows.length; i++) {
      const { row, transformations } = this.transformSingleRow(rows[i], i);
      transformedRows.push(row);
      allTransformations.push(...transformations);
    }

    return { transformedRows, transformations: allTransformations };
  }

  /**
   * Transform a single row
   */
  private transformSingleRow(
    row: AssetRowData,
    index: number,
  ): {
    row: TransformedRowData;
    transformations: TransformationRecord[];
  } {
    const transformedRow: TransformedRowData = { ...row };
    const transformations: TransformationRecord[] = [];

    // Normalize field values
    this.normalizeFieldValues(transformedRow, transformations);

    // Apply standard transformations
    this.applyStandardTransformations(transformedRow, transformations);

    // Add metadata
    this.addRowMetadata(transformedRow, index);

    return { row: transformedRow, transformations };
  }

  /**
   * Normalize field values (trim, uppercase, etc.)
   */
  private normalizeFieldValues(
    row: TransformedRowData,
    transformations: TransformationRecord[],
  ): void {
    this.normalizeStatusField(row, transformations);
    this.normalizeConditionField(row, transformations);
    this.trimAllStringFields(row, transformations);
  }

  /**
   * Normalize status field to uppercase
   */
  private normalizeStatusField(
    row: TransformedRowData,
    transformations: TransformationRecord[],
  ): void {
    const status = row[FIELD_NAMES.STATUS];
    if (status && typeof status === 'string') {
      const normalized = status.trim().toUpperCase();
      if (normalized !== status) {
        transformations.push({
          field: FIELD_NAMES.STATUS,
          before: status,
          after: normalized,
        });
        row[FIELD_NAMES.STATUS] = normalized;
      }
    }
  }

  /**
   * Normalize condition field to uppercase
   */
  private normalizeConditionField(
    row: TransformedRowData,
    transformations: TransformationRecord[],
  ): void {
    const condition = row[FIELD_NAMES.CONDITION];
    if (condition && typeof condition === 'string') {
      const normalized = condition.trim().toUpperCase();
      if (normalized !== condition) {
        transformations.push({
          field: FIELD_NAMES.CONDITION,
          before: condition,
          after: normalized,
        });
        row[FIELD_NAMES.CONDITION] = normalized;
      }
    }
  }

  /**
   * Trim all string fields in row
   */
  private trimAllStringFields(
    row: TransformedRowData,
    transformations: TransformationRecord[],
  ): void {
    for (const field of Object.keys(row)) {
      const value = row[field];
      if (typeof value === 'string' && value.trim() !== value) {
        transformations.push({
          field,
          before: value,
          after: value.trim(),
        });
        row[field] = value.trim();
      }
    }
  }

  /**
   * Apply standard transformations
   */
  private applyStandardTransformations(
    row: TransformedRowData,
    transformations: TransformationRecord[],
  ): void {
    this.transformPurchaseCost(row, transformations);
    this.transformPurchaseDate(row, transformations);
  }

  /**
   * Transform purchase cost to number format
   */
  private transformPurchaseCost(
    row: TransformedRowData,
    transformations: TransformationRecord[],
  ): void {
    const purchaseCost = row[FIELD_NAMES.PURCHASE_COST];
    if (purchaseCost && typeof purchaseCost === 'string') {
      const numValue = parseFloat(purchaseCost);
      if (!isNaN(numValue)) {
        transformations.push({
          field: FIELD_NAMES.PURCHASE_COST,
          before: purchaseCost,
          after: numValue.toString(),
        });
        row[FIELD_NAMES.PURCHASE_COST] = numValue.toString();
      }
    }
  }

  /**
   * Transform purchase date to ISO format
   */
  private transformPurchaseDate(
    row: TransformedRowData,
    transformations: TransformationRecord[],
  ): void {
    const purchaseDate = row[FIELD_NAMES.PURCHASE_DATE];
    if (purchaseDate && typeof purchaseDate === 'string') {
      const date = new Date(purchaseDate);
      if (!isNaN(date.getTime())) {
        const isoDate = date.toISOString().split('T')[0];
        if (isoDate !== purchaseDate) {
          transformations.push({
            field: FIELD_NAMES.PURCHASE_DATE,
            before: purchaseDate,
            after: isoDate,
          });
          row[FIELD_NAMES.PURCHASE_DATE] = isoDate;
        }
      }
    }
  }

  /**
   * Add row metadata
   */
  private addRowMetadata(row: TransformedRowData, index: number): void {
    row._processedAt = new Date().toISOString();
    row._rowIndex = index.toString();
  }

  /**
   * Build successful phase result
   */
  private buildPhaseResult(
    inputData: PhaseInputData,
    transformResult: {
      transformedRows: TransformedRowData[];
      transformations: TransformationRecord[];
    },
    startTime: Date,
    context: PhaseContext,
  ): PhaseResult {
    const endTime = new Date();
    const outputData = this.buildOutputData(inputData, transformResult);
    const warnings = this.buildWarnings(transformResult);
    const metrics = this.buildMetrics(startTime, endTime, transformResult);
    const debug = this.buildDebugInfo(transformResult);

    this.logPhaseCompletion(context, transformResult);

    return {
      success: true,
      phase: this.phase,
      data: outputData,
      errors: [],
      warnings,
      metrics,
      debug,
    };
  }

  /**
   * Build output data for phase result
   */
  private buildOutputData(
    inputData: PhaseInputData,
    transformResult: { transformedRows: TransformedRowData[] },
  ): PhaseInputData {
    return {
      ...inputData,
      transformedRows: transformResult.transformedRows,
    };
  }

  /**
   * Build warnings array for phase result
   */
  private buildWarnings(transformResult: {
    transformations: TransformationRecord[];
  }): string[] {
    return transformResult.transformations.length > 0
      ? [`Applied ${transformResult.transformations.length} transformations`]
      : [];
  }

  /**
   * Build metrics for phase result
   */
  private buildMetrics(
    startTime: Date,
    endTime: Date,
    transformResult: { transformedRows: TransformedRowData[] },
  ): PhaseMetrics {
    return {
      startTime,
      endTime,
      durationMs: endTime.getTime() - startTime.getTime(),
      recordsProcessed: transformResult.transformedRows.length,
      recordsSuccess: transformResult.transformedRows.length,
      recordsFailed: 0,
    };
  }

  /**
   * Build debug info for phase result
   */
  private buildDebugInfo(transformResult: {
    transformations: TransformationRecord[];
  }): Record<string, unknown> {
    return {
      transformations: transformResult.transformations.slice(
        0,
        PROCESSING_CONSTANTS.MAX_DEBUG_TRANSFORMATIONS,
      ),
    };
  }

  /**
   * Log phase completion
   */
  private logPhaseCompletion(
    context: PhaseContext,
    transformResult: {
      transformedRows: TransformedRowData[];
      transformations: TransformationRecord[];
    },
  ): void {
    this.logger.debug(
      `[${context.correlationId}] TRANSFORM phase completed: ` +
        `${transformResult.transformedRows.length} rows, ` +
        `${transformResult.transformations.length} transformations`,
    );
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
      `[${context.correlationId}] TRANSFORM phase failed: ${errorMessage}`,
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
