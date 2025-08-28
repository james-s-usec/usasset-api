import { Injectable } from '@nestjs/common';
import { LogEntry, LogLevel } from '@prisma/client';
import { LogsRepository } from './repositories/logs.repository';
import {
  DEFAULT_LOGS_PAGE_SIZE,
  DEFAULT_LOGS_LEVEL_PAGE_SIZE,
} from '../common/constants';

export interface LogEntryData {
  id: string;
  correlation_id: string;
  level: string;
  message: string;
  metadata?: unknown;
  timestamp: string;
  created_at: string;
}

export interface LogsListResponse {
  logs: LogEntryData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class LogsService {
  public constructor(private logsRepository: LogsRepository) {}

  public async findAll(
    page = 1,
    limit = DEFAULT_LOGS_PAGE_SIZE,
  ): Promise<LogsListResponse> {
    const offset = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.logsRepository.findMany(offset, limit),
      this.logsRepository.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    const formattedLogs: LogEntryData[] = this.formatLogs(logs);

    return {
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  public async findByCorrelationId(
    correlationId: string,
  ): Promise<LogEntryData[]> {
    const logs = await this.logsRepository.findByCorrelationId(correlationId);
    return this.formatLogs(logs);
  }

  public async findByLevel(
    level: string,
    page = 1,
    limit = DEFAULT_LOGS_LEVEL_PAGE_SIZE,
  ): Promise<LogsListResponse> {
    const logLevel = this.validateLogLevel(level);
    const offset = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.logsRepository.findByLevel(logLevel, offset, limit),
      this.logsRepository.countByLevel(logLevel),
    ]);

    return this.buildLogsResponse(logs, page, limit, total);
  }

  public async deleteAll(): Promise<number> {
    return this.logsRepository.deleteAll();
  }

  private validateLogLevel(level: string): LogLevel {
    const upperLevel = level.toUpperCase();
    if (!Object.values(LogLevel).includes(upperLevel as LogLevel)) {
      throw new Error(`Invalid log level: ${level}`);
    }
    return upperLevel as LogLevel;
  }

  private buildLogsResponse(
    logs: LogEntry[],
    page: number,
    limit: number,
    total: number,
  ): LogsListResponse {
    const totalPages = Math.ceil(total / limit);
    const formattedLogs: LogEntryData[] = this.formatLogs(logs);

    return {
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  private formatLogs(logs: LogEntry[]): LogEntryData[] {
    return logs.map((log: LogEntry) => ({
      id: log.id,
      correlation_id: log.correlation_id,
      level: log.level,
      message: log.message,
      metadata: log.metadata,
      timestamp: log.timestamp.toISOString(),
      created_at: log.created_at.toISOString(),
    }));
  }
}
