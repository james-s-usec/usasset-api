import { Controller, Post, Body, Get, Query, Delete } from '@nestjs/common';
import { DatabaseLoggerService } from '../common/services/database-logger.service';
import { LogsService, LogsListResponse, LogEntryData } from './logs.service';
import { DEFAULT_LOGS_PAGE_SIZE } from '../common/constants';

@Controller('logs')
export class LogsController {
  public constructor(
    private readonly dbLogger: DatabaseLoggerService,
    private readonly logsService: LogsService,
  ) {}

  @Post()
  public async logFromFrontend(
    @Body()
    logEntry: {
      level: string;
      message: string;
      metadata?: Record<string, unknown>;
      timestamp: string;
      source: string;
    },
  ): Promise<{ success: boolean }> {
    await this.processLog(logEntry);
    return { success: true };
  }

  @Get()
  public async getLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('level') level?: string,
    @Query('correlationId') correlationId?: string,
  ): Promise<LogsListResponse | { logs: LogEntryData[] }> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum =
      limit && !isNaN(Number(limit))
        ? parseInt(limit, 10)
        : DEFAULT_LOGS_PAGE_SIZE;

    if (correlationId) {
      const logs = await this.logsService.findByCorrelationId(correlationId);
      return { logs };
    }

    if (level) {
      return this.logsService.findByLevel(level, pageNum, limitNum);
    }

    return this.logsService.findAll(pageNum, limitNum);
  }

  @Delete()
  public async deleteLogs(): Promise<{
    message: string;
    deletedCount: number;
  }> {
    const deletedCount = await this.logsService.deleteAll();
    return {
      message: `Successfully deleted ${deletedCount} log entries`,
      deletedCount,
    };
  }

  private async processLog(logEntry: {
    level: string;
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const { level, message, metadata } = logEntry;
    const correlationId = `frontend-${Date.now()}`;
    const enrichedMetadata = { ...metadata, source: 'frontend' };

    switch (level) {
      case 'error':
        await this.dbLogger.logError(correlationId, message, enrichedMetadata);
        break;
      case 'warn':
        await this.dbLogger.logWarn(correlationId, message, enrichedMetadata);
        break;
      case 'debug':
        await this.dbLogger.logDebug(correlationId, message, enrichedMetadata);
        break;
      default:
        await this.dbLogger.logInfo(correlationId, message, enrichedMetadata);
    }
  }
}
