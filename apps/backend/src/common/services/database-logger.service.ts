import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LogLevel, LogEntry as PrismaLogEntry, Prisma } from '@prisma/client';

export interface LogMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

@Injectable()
export class DatabaseLoggerService {
  private readonly logger = new Logger(DatabaseLoggerService.name);

  public constructor(private readonly prisma: PrismaService) {}

  public async log(
    level: LogLevel,
    correlationId: string,
    message: string,
    metadata?: LogMetadata,
  ): Promise<void> {
    await this.logEntry(level, correlationId, message, metadata);
  }

  public async findLogsByCorrelationId(
    correlationId: string,
  ): Promise<PrismaLogEntry[]> {
    try {
      return await this.prisma.logEntry.findMany({
        where: { correlation_id: correlationId },
        orderBy: { timestamp: 'asc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find logs for correlation ID ${correlationId}:`,
        error,
      );
      return [];
    }
  }

  private async logEntry(
    level: LogLevel,
    correlationId: string,
    message: string,
    metadata?: LogMetadata,
  ): Promise<void> {
    try {
      await this.prisma.logEntry.create({
        data: {
          level,
          correlation_id: correlationId,
          message,
          metadata: metadata
            ? (metadata as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log ${level} entry:`, error);
    }
  }
}

// Re-export for use in other modules
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  correlation_id: string;
  message: string;
  metadata: LogMetadata | null;
  created_at: Date;
}
