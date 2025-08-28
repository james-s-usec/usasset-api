import { Controller, Post, Body } from '@nestjs/common';
import { DatabaseLoggerService } from '../common/services/database-logger.service';

@Controller('logs')
export class LogsController {
  public constructor(private readonly dbLogger: DatabaseLoggerService) {}

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
