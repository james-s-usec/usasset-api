import { Logger } from '@nestjs/common';
import { PipelinePhase } from '@prisma/client';

export class PipelineLogger {
  public static logPhaseStart(
    logger: Logger,
    phase: string | PipelinePhase,
    correlationId: string,
  ): void {
    logger.debug(`[${correlationId}] Starting ${phase} phase`);
  }

  public static logPhaseComplete(
    logger: Logger,
    phase: string | PipelinePhase,
    correlationId: string,
    recordCount?: number,
    durationMs?: number,
  ): void {
    const metrics = [];
    if (recordCount !== undefined) {
      metrics.push(`${recordCount} records`);
    }
    if (durationMs !== undefined) {
      metrics.push(`${durationMs}ms`);
    }

    const metricsStr = metrics.length > 0 ? `: ${metrics.join(', ')}` : '';
    logger.debug(`[${correlationId}] ${phase} completed${metricsStr}`);
  }

  public static logPhaseError(
    logger: Logger,
    phase: string | PipelinePhase,
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
    correlationId: string,
    ruleName: string,
    targetField: string,
    success: boolean,
  ): void {
    const status = success ? 'Applied' : 'Failed to apply';
    logger.debug(
      `[${correlationId}] ${status} rule: ${ruleName} to ${targetField}`,
    );
  }

  public static logBatchProcessing(
    logger: Logger,
    correlationId: string,
    batchNumber: number,
    batchSize: number,
    totalBatches?: number,
  ): void {
    const progress = totalBatches ? ` (${batchNumber}/${totalBatches})` : '';
    logger.debug(
      `[${correlationId}] Processing batch ${batchNumber}${progress}: ${batchSize} items`,
    );
  }
}
