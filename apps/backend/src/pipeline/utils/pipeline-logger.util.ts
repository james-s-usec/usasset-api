import { Logger } from '@nestjs/common';
import { PipelinePhase } from '@prisma/client';

export class PipelineLogger {
  public static logPhaseStart(
    logger: Logger,
    phase: PipelinePhase,
    correlationId: string,
  ): void {
    logger.debug(`[${correlationId}] Starting ${phase} phase`);
  }

  public static logPhaseComplete(
    logger: Logger,
    options: {
      phase: PipelinePhase;
      correlationId: string;
      recordCount?: number;
      durationMs?: number;
    },
  ): void {
    const metrics = [];
    if (options.recordCount !== undefined) {
      metrics.push(`${options.recordCount} records`);
    }
    if (options.durationMs !== undefined) {
      metrics.push(`${options.durationMs}ms`);
    }

    const metricsStr = metrics.length > 0 ? `: ${metrics.join(', ')}` : '';
    logger.debug(
      `[${options.correlationId}] ${options.phase} completed${metricsStr}`,
    );
  }

  public static logPhaseError(
    logger: Logger,
    phase: PipelinePhase,
    correlationId: string,
    error: unknown,
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`[${correlationId}] ${phase} failed: ${errorMessage}`);
  }

  public static logRowProcessing(
    logger: Logger,
    correlationId: string,
    rowNumber: number,
    totalRows?: number,
  ): void {
    const progress = totalRows ? ` (${rowNumber}/${totalRows})` : '';
    logger.debug(`[${correlationId}] Processing row ${rowNumber}${progress}`);
  }

  public static logRuleApplication(
    logger: Logger,
    options: {
      correlationId: string;
      ruleName: string;
      targetField: string;
      success: boolean;
    },
  ): void {
    const status = options.success ? 'Applied' : 'Failed to apply';
    logger.debug(
      `[${options.correlationId}] ${status} rule: ${options.ruleName} to ${options.targetField}`,
    );
  }

  public static logBatchProcessing(
    logger: Logger,
    options: {
      correlationId: string;
      batchNumber: number;
      batchSize: number;
      totalBatches?: number;
    },
  ): void {
    const progress = options.totalBatches
      ? ` (${options.batchNumber}/${options.totalBatches})`
      : '';
    logger.debug(
      `[${options.correlationId}] Processing batch ${options.batchNumber}${progress}: ${options.batchSize} items`,
    );
  }
}
