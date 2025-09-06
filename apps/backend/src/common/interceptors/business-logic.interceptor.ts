import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';
import { DatabaseLoggerService } from '../services/database-logger.service';
import { CORRELATION_ID_KEY } from './correlation-id.interceptor';

@Injectable()
export class BusinessLogicInterceptor implements NestInterceptor {
  public constructor(private readonly dbLogger: DatabaseLoggerService) {}

  private extractContext(context: ExecutionContext): {
    operation: string;
    correlationId: string;
    args: unknown[];
  } {
    const request = context.switchToHttp().getRequest<Request>();
    const operation = `${context.getClass().name}.${context.getHandler().name}`;
    const correlationId =
      (request[CORRELATION_ID_KEY] as string) || 'no-correlation';
    const args = [request.body, request.params, request.query];
    return { operation, correlationId, args };
  }

  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const { operation, correlationId, args } = this.extractContext(context);
    const startTime = Date.now();

    this.logOperationStart(correlationId, operation, args);

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - startTime;
        this.logOperationSuccess(correlationId, operation, response, duration);
      }),
      catchError((error: unknown) => {
        const duration = Date.now() - startTime;
        this.logOperationError({
          correlationId,
          operation,
          error,
          inputs: args,
          duration,
        });
        return throwError(() => error as Error);
      }),
    );
  }

  private logOperationStart(
    correlationId: string,
    operation: string,
    inputs: unknown[],
  ): void {
    this.dbLogger
      .logDebug(correlationId, `🎯 STARTING ${operation}`, {
        operation,
        inputs: JSON.stringify(inputs),
        timestamp: new Date().toISOString(),
      })
      .catch(() => {
        // Ignore logging errors - don't break the actual operation
      });
  }

  private logOperationSuccess(
    correlationId: string,
    operation: string,
    result: unknown,
    duration: number,
  ): void {
    this.dbLogger
      .logInfo(correlationId, `✅ COMPLETED ${operation} in ${duration}ms`, {
        operation,
        result: JSON.stringify(result),
        duration,
        timestamp: new Date().toISOString(),
      })
      .catch(() => {
        // Ignore logging errors
      });
  }

  private logOperationError(params: {
    correlationId: string;
    operation: string;
    error: unknown;
    inputs: unknown[];
    duration: number;
  }): void {
    const { correlationId, operation, error, inputs, duration } = params;
    this.dbLogger
      .logError(correlationId, `❌ FAILED ${operation} after ${duration}ms`, {
        operation,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType:
          (error as { constructor?: { name?: string } })?.constructor?.name ||
          'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
        inputs: JSON.stringify(inputs),
        duration,
        timestamp: new Date().toISOString(),
      })
      .catch(() => {
        // Ignore logging errors
      });
  }
}
