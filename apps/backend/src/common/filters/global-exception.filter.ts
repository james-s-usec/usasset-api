import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../dto/api-response.dto';
import { CORRELATION_ID_KEY } from '../middleware/correlation-id.middleware';
import { DatabaseLoggerService } from '../services/database-logger.service';

interface ErrorDetails {
  status: number;
  code: string;
  message: string;
  details?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  public constructor(
    @Inject(DatabaseLoggerService)
    private readonly dbLogger: DatabaseLoggerService,
  ) {}

  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId = (request[CORRELATION_ID_KEY] as string) || 'unknown';
    const errorDetails = this.extractErrorDetails(exception);
    const errorResponse = this.buildErrorResponse(errorDetails, correlationId);

    this.logError(request, errorDetails, correlationId, exception);
    response.status(errorDetails.status).json(errorResponse);
  }

  private extractErrorDetails(exception: unknown): ErrorDetails {
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception);
    }

    if (exception instanceof Error) {
      return this.handleGenericError(exception);
    }

    return this.handleUnknownError();
  }

  private handleHttpException(exception: HttpException): ErrorDetails {
    const status = exception.getStatus();
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return {
        status,
        code: this.getErrorCode(status),
        message: response,
      };
    }

    const responseObj = response as Record<string, unknown>;
    const message = (responseObj.message as string) || exception.message;
    const details = Array.isArray(responseObj.message)
      ? (responseObj.message as string[]).join(', ')
      : undefined;

    return {
      status,
      code: this.getErrorCode(status),
      message,
      details,
    };
  }

  private handleGenericError(exception: Error): ErrorDetails {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: exception.message,
      details: isProduction ? undefined : exception.stack,
    };
  }

  private handleUnknownError(): ErrorDetails {
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    };
  }

  private buildErrorResponse(
    errorDetails: ErrorDetails,
    correlationId: string,
  ): ApiErrorResponse {
    return {
      success: false,
      error: {
        code: errorDetails.code,
        message: errorDetails.message,
        details: errorDetails.details,
        statusCode: errorDetails.status,
      },
      correlationId,
      timestamp: new Date().toISOString(),
    };
  }

  private logError(
    request: Request,
    errorDetails: ErrorDetails,
    correlationId: string,
    exception: unknown,
  ): void {
    const message = `${request.method} ${request.url} - ${errorDetails.status} - ${errorDetails.message}`;
    const metadata = {
      statusCode: errorDetails.status,
      method: request.method,
      url: request.url,
      userAgent: request.get('user-agent'),
      ip: request.ip,
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    this.logger.error(message, { correlationId, ...metadata });

    void this.dbLogger.logError(correlationId, message, metadata);
  }

  private getErrorCode(status: HttpStatus): string {
    const errorCodeMap: Partial<Record<HttpStatus, string>> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
      [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMIT_EXCEEDED',
    };

    return errorCodeMap[status] || 'INTERNAL_SERVER_ERROR';
  }
}
