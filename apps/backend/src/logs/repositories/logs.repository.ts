import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LogEntry, LogLevel } from '@prisma/client';
import {
  HOURS_IN_DAY,
  MINUTES_IN_HOUR,
  SECONDS_IN_MINUTE,
  MILLISECONDS_IN_SECOND,
  DEFAULT_RECENT_LOGS_LIMIT,
} from '../../common/constants';

@Injectable()
export class LogsRepository {
  public constructor(private prisma: PrismaService) {}

  public async findMany(skip: number, take: number): Promise<LogEntry[]> {
    return this.prisma.logEntry.findMany({
      orderBy: { created_at: 'desc' },
      skip,
      take,
    });
  }

  public async count(): Promise<number> {
    return this.prisma.logEntry.count();
  }

  public async findByCorrelationId(correlationId: string): Promise<LogEntry[]> {
    return this.prisma.logEntry.findMany({
      where: { correlation_id: correlationId },
      orderBy: { created_at: 'desc' },
    });
  }

  public async findByLevel(
    level: LogLevel,
    skip: number,
    take: number,
  ): Promise<LogEntry[]> {
    return this.prisma.logEntry.findMany({
      where: { level },
      orderBy: { created_at: 'desc' },
      skip,
      take,
    });
  }

  public async countByLevel(level: LogLevel): Promise<number> {
    return this.prisma.logEntry.count({
      where: { level },
    });
  }

  public async findRecent(hours = HOURS_IN_DAY): Promise<LogEntry[]> {
    const since = new Date(
      Date.now() -
        hours * MINUTES_IN_HOUR * SECONDS_IN_MINUTE * MILLISECONDS_IN_SECOND,
    );

    return this.prisma.logEntry.findMany({
      where: {
        created_at: {
          gte: since,
        },
      },
      orderBy: { created_at: 'desc' },
      take: DEFAULT_RECENT_LOGS_LIMIT,
    });
  }

  public async findByTimeRange(
    startTime: Date,
    endTime: Date,
  ): Promise<LogEntry[]> {
    return this.prisma.logEntry.findMany({
      where: {
        created_at: {
          gte: startTime,
          lte: endTime,
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  public async deleteAll(): Promise<number> {
    const result = await this.prisma.logEntry.deleteMany({});
    return result.count;
  }
}
