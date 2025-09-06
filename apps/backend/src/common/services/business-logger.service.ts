import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { DatabaseLoggerService } from './database-logger.service';
import { CORRELATION_ID_KEY } from '../interceptors/correlation-id.interceptor';

@Injectable()
export class BusinessLoggerService {
  public constructor(
    private readonly dbLogger: DatabaseLoggerService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  private getCorrelationId(): string {
    return (this.request[CORRELATION_ID_KEY] as string) || 'no-correlation';
  }

  public async logOperationStart(
    operation: string,
    inputs: unknown[],
  ): Promise<void> {
    const correlationId = this.getCorrelationId();
    await this.dbLogger.logDebug(correlationId, `🎯 STARTING ${operation}`, {
      operation,
      inputs: JSON.stringify(inputs),
      timestamp: new Date().toISOString(),
    });
  }

  public async logOperationSuccess(
    operation: string,
    result: unknown,
    duration: number,
  ): Promise<void> {
    const correlationId = this.getCorrelationId();
    await this.dbLogger.logInfo(
      correlationId,
      `✅ COMPLETED ${operation} in ${duration}ms`,
      {
        operation,
        result: JSON.stringify(result),
        duration,
        timestamp: new Date().toISOString(),
      },
    );
  }

  public async logOperationError(
    operation: string,
    error: unknown,
    inputs: unknown[],
    duration: number,
  ): Promise<void> {
    const correlationId = this.getCorrelationId();
    await this.dbLogger.logError(
      correlationId,
      `❌ FAILED ${operation} after ${duration}ms`,
      {
        operation,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.constructor?.name || 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
        inputs: JSON.stringify(inputs),
        duration,
        timestamp: new Date().toISOString(),
      },
    );
  }
}
