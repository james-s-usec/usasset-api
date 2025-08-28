import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { ApiSuccessResponse } from '../dto/api-response.dto';
import { CORRELATION_ID_KEY } from '../middleware/correlation-id.middleware';
import { DatabaseLoggerService } from '../services/database-logger.service';

interface RequestLogContext<T> {
  request: Request;
  response: Response;
  correlationId: string;
  startTime: number;
  responseData: ApiSuccessResponse<T>;
}

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, ApiSuccessResponse<T>>
{
  public constructor(
    @Inject(DatabaseLoggerService)
    private readonly dbLogger: DatabaseLoggerService,
  ) {}

  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const correlationId = (request[CORRELATION_ID_KEY] as string) || 'unknown';

    const startTime = Date.now();

    return next.handle().pipe(
      map((data: T) => this.buildSuccessResponse(data, correlationId)),
      tap((responseData: ApiSuccessResponse<T>) => {
        const logContext = {
          request,
          response,
          correlationId,
          startTime,
          responseData,
        };
        this.logRequestResponse(logContext);
      }),
    );
  }

  private buildSuccessResponse<T>(
    data: T,
    correlationId: string,
  ): ApiSuccessResponse<T> {
    return {
      success: true,
      data,
      correlationId,
      timestamp: new Date().toISOString(),
    };
  }

  private logRequestResponse<T>(context: RequestLogContext<T>): void {
    const { request, response, correlationId, startTime, responseData } =
      context;
    const endTime = Date.now();
    const duration = endTime - startTime;

    const logMessage = `${request.method} ${request.url} - ${response.statusCode} - ${duration}ms`;
    const metadata = this.buildLogMetadata(
      request,
      response,
      duration,
      responseData,
    );

    void this.dbLogger.logInfo(correlationId, logMessage, metadata);
  }

  private buildLogMetadata<T>(
    request: Request,
    response: Response,
    duration: number,
    responseData: ApiSuccessResponse<T>,
  ): Record<string, string | number> {
    return {
      method: request.method,
      url: request.url,
      statusCode: response.statusCode,
      userAgent: request.get('user-agent') || 'unknown',
      ip: request.ip || 'unknown',
      duration,
      requestHeaders: JSON.stringify(request.headers),
      requestBody: JSON.stringify(request.body),
      responseData: JSON.stringify(responseData.data),
      timestamp: responseData.timestamp,
    };
  }
}
