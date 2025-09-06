import { Logger } from '@nestjs/common';
import { PipelinePhase } from '@prisma/client';
import { PhaseResult } from '../orchestrator/phase-processor.interface';

export class PipelineErrorHandler {
  public static handlePhaseError(
    error: unknown,
    phase: PipelinePhase,
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
    options: {
      ruleName: string;
      fieldName: string;
      correlationId: string;
      logger?: Logger;
    },
  ): string {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const contextualMessage = `Rule '${options.ruleName}' failed on field '${options.fieldName}': ${errorMessage}`;

    if (options.logger) {
      options.logger.warn(`[${options.correlationId}] ${contextualMessage}`, {
        ruleName: options.ruleName,
        fieldName: options.fieldName,
        correlationId: options.correlationId,
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
    options: {
      batchNumber: number;
      batchSize: number;
      correlationId: string;
      logger?: Logger;
    },
  ): string {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const contextualMessage = `Batch ${options.batchNumber} (${options.batchSize} items) failed: ${errorMessage}`;

    if (options.logger) {
      options.logger.error(`[${options.correlationId}] ${contextualMessage}`, {
        batchNumber: options.batchNumber,
        batchSize: options.batchSize,
        correlationId: options.correlationId,
        error: error instanceof Error ? error.stack : error,
      });
    }

    return contextualMessage;
  }

  public static createPhaseResult(
    phase: PipelinePhase,
    error: unknown,
    correlationId: string,
  ): PhaseResult {
    return {
      success: false as const,
      phase,
      data: {},
      errors: this.buildErrorArray(
        phase,
        correlationId,
        this.extractErrorMessage(error),
      ),
      warnings: [],
      metrics: this.buildFailedMetrics(),
    };
  }

  private static extractErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private static buildErrorArray(
    phase: PipelinePhase,
    correlationId: string,
    errorMessage: string,
  ): string[] {
    return [`[${correlationId}] ${phase} failed: ${errorMessage}`];
  }

  private static buildFailedMetrics(): {
    startTime: Date;
    endTime: Date;
    durationMs: number;
    recordsProcessed: 0;
    recordsSuccess: 0;
    recordsFailed: 1;
  } {
    const now = new Date();
    return {
      startTime: now,
      endTime: now,
      durationMs: 0,
      recordsProcessed: 0,
      recordsSuccess: 0,
      recordsFailed: 1,
    };
  }
}
