import { Injectable, Logger } from '@nestjs/common';
import { PipelinePhase } from '@prisma/client';
import {
  PhaseProcessor,
  PhaseContext,
  PhaseResult,
  PhaseInputData,
  AssetRowData,
  FIELD_NAMES,
} from '../../orchestrator/phase-processor.interface';

const MAX_DEBUG_TRANSFORMATIONS = 10;

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
      return this.buildPhaseResult(data, transformResult, startTime, context);
    } catch (error) {
      return this.buildErrorResult(error, startTime, context);
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
    // Normalize status field
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

    // Normalize condition field
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

    // Trim all string fields
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
    // Convert purchase cost to number if needed
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

    // Standardize date format
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

    const outputData: PhaseInputData = {
      ...inputData,
      transformedRows: transformResult.transformedRows,
    };

    this.logger.debug(
      `[${context.correlationId}] TRANSFORM phase completed: ` +
        `${transformResult.transformedRows.length} rows, ` +
        `${transformResult.transformations.length} transformations`,
    );

    return {
      success: true,
      phase: this.phase,
      data: outputData,
      errors: [],
      warnings:
        transformResult.transformations.length > 0
          ? [
              `Applied ${transformResult.transformations.length} transformations`,
            ]
          : [],
      metrics: {
        startTime,
        endTime,
        durationMs: endTime.getTime() - startTime.getTime(),
        recordsProcessed: transformResult.transformedRows.length,
        recordsSuccess: transformResult.transformedRows.length,
        recordsFailed: 0,
      },
      debug: {
        transformations: transformResult.transformations.slice(
          0,
          MAX_DEBUG_TRANSFORMATIONS,
        ),
      },
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
