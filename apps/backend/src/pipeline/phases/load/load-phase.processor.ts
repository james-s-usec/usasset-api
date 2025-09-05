import { Injectable, Logger } from '@nestjs/common';
import { PipelinePhase } from '@prisma/client';
import {
  PhaseProcessor,
  PhaseContext,
  PhaseResult,
} from '../../orchestrator/phase-processor.interface';

interface LoadResult {
  action: string;
  data: Record<string, unknown>;
  success: boolean;
  error?: string;
}

interface LoadData extends Record<string, unknown> {
  loadResults: LoadResult[];
}

interface Transformation {
  field: string;
  before: string;
  after: string;
}

@Injectable()
export class LoadPhaseProcessor implements PhaseProcessor {
  public readonly phase = PipelinePhase.LOAD;
  public readonly name = 'Database Loader';
  public readonly description =
    'Loads data into database: CONFLICT_RESOLUTION, BATCH_SIZE, TRANSACTION_BOUNDARY';

  private readonly logger = new Logger(LoadPhaseProcessor.name);

  // Configuration constants
  private readonly BATCH_SIZE = 10;
  private readonly RULES = {
    BATCH_SIZE: 'BATCH_SIZE (10)',
    CONFLICT_RESOLUTION: 'CONFLICT_RESOLUTION (upsert)',
    TRANSACTION_BOUNDARY: 'TRANSACTION_BOUNDARY (per batch)',
  };

  public async process(
    data: Record<string, unknown>,
    context: PhaseContext,
  ): Promise<PhaseResult> {
    const startTime = new Date();
    this.logger.debug(`[${context.correlationId}] Starting LOAD phase`);

    try {
      const sourceRows = this.extractSourceRows(data);
      const result = await this.loadDataInBatches(sourceRows);

      return this.createSuccessResult(
        startTime,
        data,
        result,
        sourceRows.length,
      );
    } catch (error) {
      return this.createErrorResult(startTime, data, error);
    }
  }

  private extractSourceRows(
    data: Record<string, unknown>,
  ): Array<Record<string, unknown>> {
    const sourceRows =
      data.mappedRows ||
      data.transformedRows ||
      data.cleanedRows ||
      data.validRows ||
      data.rows;

    if (!sourceRows || !Array.isArray(sourceRows)) {
      throw new Error('Invalid input: expected rows array from previous phase');
    }

    return sourceRows as Array<Record<string, unknown>>;
  }

  private async loadDataInBatches(
    sourceRows: Array<Record<string, unknown>>,
  ): Promise<{
    loadResults: LoadResult[];
    transformations: Transformation[];
    successCount: number;
    failureCount: number;
  }> {
    const loadResults: LoadResult[] = [];
    const transformations: Transformation[] = [];
    let successCount = 0;
    let failureCount = 0;

    const batches = this.createBatches(sourceRows);

    this.logger.debug(
      `Processing ${sourceRows.length} records in ${batches.length} batches of ${this.BATCH_SIZE}`,
    );

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batchResult = await this.processBatch(
        batches[batchIndex],
        batchIndex,
      );

      loadResults.push(...batchResult.loadResults);
      transformations.push(...batchResult.transformations);
      successCount += batchResult.successCount;
      failureCount += batchResult.failureCount;
    }

    return { loadResults, transformations, successCount, failureCount };
  }

  private createBatches(
    sourceRows: Array<Record<string, unknown>>,
  ): Array<Array<Record<string, unknown>>> {
    const batches: Array<Array<Record<string, unknown>>> = [];

    for (let i = 0; i < sourceRows.length; i += this.BATCH_SIZE) {
      batches.push(sourceRows.slice(i, i + this.BATCH_SIZE));
    }

    return batches;
  }

  private async processBatch(
    batch: Array<Record<string, unknown>>,
    batchIndex: number,
  ): Promise<{
    loadResults: LoadResult[];
    transformations: Transformation[];
    successCount: number;
    failureCount: number;
  }> {
    const loadResults: LoadResult[] = [];
    const transformations: Transformation[] = [];

    try {
      // Simulate transaction start
      for (const row of batch) {
        const result = await this.processRow(row);
        loadResults.push(result.loadResult);

        if (result.transformation) {
          transformations.push(result.transformation);
        }
      }

      // Simulate transaction commit
      this.logger.debug(
        `Batch ${batchIndex + 1} committed successfully (${batch.length} records)`,
      );

      return {
        loadResults,
        transformations,
        successCount: batch.length,
        failureCount: 0,
      };
    } catch (batchError) {
      return this.handleBatchError(batch, batchIndex, batchError);
    }
  }

  private async processRow(row: Record<string, unknown>): Promise<{
    loadResult: LoadResult;
    transformation?: Transformation;
  }> {
    // PLACEHOLDER: Simulate conflict resolution
    const existingRecord = await this.checkExistingRecord(row);
    const assetTag = (row.assetTag as string) || 'unknown';

    if (existingRecord) {
      // CONFLICT_RESOLUTION rule - update existing
      return {
        loadResult: {
          action: 'UPDATE',
          data: row,
          success: true,
        },
        transformation: {
          field: `record_${assetTag}`,
          before: 'existing record',
          after: 'updated record',
        },
      };
    } else {
      // Insert new record
      return {
        loadResult: {
          action: 'INSERT',
          data: row,
          success: true,
        },
        transformation: {
          field: `record_${assetTag}`,
          before: 'no record',
          after: 'new record inserted',
        },
      };
    }
  }

  private async checkExistingRecord(
    row: Record<string, unknown>,
  ): Promise<boolean> {
    // PLACEHOLDER: Would check database for existing record
    // For now, always return false to simulate inserts
    return Promise.resolve(false);
  }

  private handleBatchError(
    batch: Array<Record<string, unknown>>,
    batchIndex: number,
    error: unknown,
  ): {
    loadResults: LoadResult[];
    transformations: Transformation[];
    successCount: number;
    failureCount: number;
  } {
    this.logger.error(`Batch ${batchIndex + 1} failed, rolling back`);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const loadResults: LoadResult[] = batch.map((row) => ({
      action: 'FAILED',
      data: row,
      success: false,
      error: errorMessage,
    }));

    return {
      loadResults,
      transformations: [],
      successCount: 0,
      failureCount: batch.length,
    };
  }

  private createSuccessResult(
    startTime: Date,
    originalData: Record<string, unknown>,
    result: {
      loadResults: LoadResult[];
      transformations: Transformation[];
      successCount: number;
      failureCount: number;
    },
    totalRecords: number,
  ): PhaseResult {
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();

    const loadedData: LoadData = {
      ...originalData,
      loadResults: result.loadResults,
    };

    this.logger.debug(
      `[LOAD] phase completed: ${result.successCount} success, ${result.failureCount} failed in ${durationMs}ms`,
    );

    return {
      success: result.failureCount === 0,
      phase: this.phase,
      data: loadedData,
      errors:
        result.failureCount > 0
          ? [`${result.failureCount} records failed to load`]
          : [],
      warnings: [],
      metrics: {
        startTime,
        endTime,
        durationMs,
        recordsProcessed: totalRecords,
        recordsSuccess: result.successCount,
        recordsFailed: result.failureCount,
      },
      debug: {
        rulesApplied: Object.values(this.RULES),
        transformations: result.transformations,
      },
    };
  }

  private createErrorResult(
    startTime: Date,
    data: Record<string, unknown>,
    error: unknown,
  ): PhaseResult {
    const endTime = new Date();
    const errorMessage = error instanceof Error ? error.message : String(error);

    this.logger.error(`[LOAD] phase failed: ${errorMessage}`);

    return {
      success: false,
      phase: this.phase,
      data,
      errors: [`LOAD failed: ${errorMessage}`],
      warnings: [],
      metrics: {
        startTime,
        endTime,
        durationMs: endTime.getTime() - startTime.getTime(),
        recordsProcessed: 0,
        recordsSuccess: 0,
        recordsFailed: 1,
      },
    };
  }
}
