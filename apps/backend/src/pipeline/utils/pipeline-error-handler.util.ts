import { Logger } from '@nestjs/common';
import { PipelinePhase } from '@prisma/client';

export class PipelineErrorHandler {
  public static handlePhaseError(
    error: unknown,
    phase: string | PipelinePhase,
    correlationId: string,
    logger?: Logger,
  ): never {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const contextualMessage = `${phase} phase failed: ${errorMessage}`;

    if (logger) {
      logger.error(`[${correlationId}] ${contextualMessage}`, {
        phase,
        correlationId,
        error: error instanceof Error ? error.stack : error,
      });
    }

    throw new Error(`[${correlationId}] ${contextualMessage}`);
  }

  public static handleRuleError(
    error: unknown,
    ruleName: string,
    fieldName: string,
    correlationId: string,
    logger?: Logger,
  ): string {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const contextualMessage = `Rule '${ruleName}' failed on field '${fieldName}': ${errorMessage}`;

    if (logger) {
      logger.warn(`[${correlationId}] ${contextualMessage}`, {
        ruleName,
        fieldName,
        correlationId,
        error: error instanceof Error ? error.stack : error,
      });
    }

    return contextualMessage;
  }

  public static handleValidationError(
    error: unknown,
    rowNumber: number,
    correlationId: string,
    logger?: Logger,
  ): string {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const contextualMessage = `Row ${rowNumber} validation failed: ${errorMessage}`;

    if (logger) {
      logger.debug(`[${correlationId}] ${contextualMessage}`, {
        rowNumber,
        correlationId,
        error: error instanceof Error ? error.stack : error,
      });
    }

    return contextualMessage;
  }

  public static handleBatchError(
    error: unknown,
    batchNumber: number,
    batchSize: number,
    correlationId: string,
    logger?: Logger,
  ): string {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const contextualMessage = `Batch ${batchNumber} (${batchSize} items) failed: ${errorMessage}`;

    if (logger) {
      logger.error(`[${correlationId}] ${contextualMessage}`, {
        batchNumber,
        batchSize,
        correlationId,
        error: error instanceof Error ? error.stack : error,
      });
    }

    return contextualMessage;
  }

  public static createPhaseResult(
    phase: PipelinePhase,
    error: unknown,
    correlationId: string,
  ): {
    success: false;
    phase: PipelinePhase;
    data: Record<string, unknown>;
    errors: string[];
    warnings: string[];
    metrics: {
      startTime: Date;
      endTime: Date;
      durationMs: number;
      recordsProcessed: 0;
      recordsSuccess: 0;
      recordsFailed: 1;
    };
  } {
    const now = new Date();
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      phase,
      data: {},
      errors: [`[${correlationId}] ${phase} failed: ${errorMessage}`],
      warnings: [],
      metrics: {
        startTime: now,
        endTime: now,
        durationMs: 0,
        recordsProcessed: 0,
        recordsSuccess: 0,
        recordsFailed: 1,
      },
    };
  }
}
