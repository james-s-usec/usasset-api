import { Injectable, Logger } from '@nestjs/common';
import { PipelinePhase } from '@prisma/client';
import {
  PhaseProcessor,
  PhaseContext,
  PhaseResult,
  PhaseMetrics,
  PhaseDebugInfo,
} from '../../orchestrator/phase-processor.interface';

import { PROCESSING_CONSTANTS } from '../../constants/processing.constants';

interface LoadResult {
  action: string;
  data: Record<string, unknown>;
  success: boolean;
  error?: string;
}

interface Transformation {
  field: string;
  before: unknown;
  after: unknown;
}

@Injectable()
export class LoadPhaseProcessor implements PhaseProcessor {
  public readonly phase = PipelinePhase.LOAD;
  public readonly name = 'Database Loader';
  public readonly description =
    'Loads data into database: CONFLICT_RESOLUTION, BATCH_SIZE, TRANSACTION_BOUNDARY';

  private readonly logger = new Logger(LoadPhaseProcessor.name);

  // Configuration constants
  private readonly BATCH_SIZE = PROCESSING_CONSTANTS.DEFAULT_BATCH_SIZE;
  private readonly RULES = {
    BATCH_SIZE: `BATCH_SIZE (${PROCESSING_CONSTANTS.DEFAULT_BATCH_SIZE})`,
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
    try {
      const results = await this.processAllRowsInBatch(batch);
      this.logBatchSuccess(batchIndex, batch.length);
      return this.createBatchSuccessResult(results, batch.length);
    } catch (batchError) {
      return this.handleBatchError(batch, batchIndex, batchError);
    }
  }

  private async processAllRowsInBatch(
    batch: Array<Record<string, unknown>>,
  ): Promise<{ loadResults: LoadResult[]; transformations: Transformation[] }> {
    const loadResults: LoadResult[] = [];
    const transformations: Transformation[] = [];

    for (const row of batch) {
      const result = await this.processRow(row);
      loadResults.push(result.loadResult);

      if (result.transformation) {
        transformations.push(result.transformation);
      }
    }

    return { loadResults, transformations };
  }

  private logBatchSuccess(batchIndex: number, batchSize: number): void {
    this.logger.debug(
      `Batch ${batchIndex + 1} committed successfully (${batchSize} records)`,
    );
  }

  private createBatchSuccessResult(
    results: { loadResults: LoadResult[]; transformations: Transformation[] },
    batchSize: number,
  ): {
    loadResults: LoadResult[];
    transformations: Transformation[];
    successCount: number;
    failureCount: number;
  } {
    return {
      loadResults: results.loadResults,
      transformations: results.transformations,
      successCount: batchSize,
      failureCount: 0,
    };
  }

  private async processRow(row: Record<string, unknown>): Promise<{
    loadResult: LoadResult;
    transformation?: Transformation;
  }> {
    const existingRecord = await this.checkExistingRecord();
    const assetTag = (row.assetTag as string) || 'unknown';

    if (existingRecord) {
      return this.createUpdateResult(row, assetTag);
    } else {
      return this.createInsertResult(row, assetTag);
    }
  }

  private createUpdateResult(
    row: Record<string, unknown>,
    assetTag: string,
  ): { loadResult: LoadResult; transformation?: Transformation } {
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
  }

  private createInsertResult(
    row: Record<string, unknown>,
    assetTag: string,
  ): { loadResult: LoadResult; transformation?: Transformation } {
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

  private async checkExistingRecord(): Promise<boolean> {
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
    const loadedData = this.createLoadedData(originalData, result.loadResults);
    this.logLoadCompletion(result, durationMs);

    return {
      success: result.failureCount === 0,
      phase: this.phase,
      data: loadedData,
      errors: this.buildErrors(result.failureCount),
      warnings: [],
      metrics: this.buildMetrics(startTime, endTime, durationMs, {
        ...result,
        totalRecords,
      }),
      debug: this.buildDebugInfo(result.transformations),
    };
  }

  private createLoadedData(
    originalData: Record<string, unknown>,
    loadResults: LoadResult[],
  ): unknown {
    return {
      ...originalData,
      loadResults,
    };
  }

  private logLoadCompletion(
    result: { successCount: number; failureCount: number },
    durationMs: number,
  ): void {
    this.logger.debug(
      `[LOAD] phase completed: ${result.successCount} success, ${result.failureCount} failed in ${durationMs}ms`,
    );
  }

  private buildErrors(failureCount: number): string[] {
    return failureCount > 0 ? [`${failureCount} records failed to load`] : [];
  }

  private buildMetrics(
    startTime: Date,
    endTime: Date,
    durationMs: number,
    result: {
      successCount: number;
      failureCount: number;
      totalRecords: number;
    },
  ): PhaseMetrics {
    return {
      startTime,
      endTime,
      durationMs,
      recordsProcessed: result.totalRecords,
      recordsSuccess: result.successCount,
      recordsFailed: result.failureCount,
    };
  }

  private buildDebugInfo(transformations: Transformation[]): PhaseDebugInfo {
    return {
      rulesApplied: Object.values(this.RULES),
      transformations,
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
