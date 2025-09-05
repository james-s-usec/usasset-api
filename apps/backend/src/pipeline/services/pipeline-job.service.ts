import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JobStatus as PrismaJobStatus } from '@prisma/client';

interface JobStatus {
  id: string;
  file_id: string;
  status: string;
  total_rows: number | null;
  processed_rows: number;
  error_rows: number;
  errors: string[];
  started_at: Date;
  completed_at: Date | null;
}

@Injectable()
export class PipelineJobService {
  private readonly logger = new Logger(PipelineJobService.name);

  public constructor(private readonly prisma: PrismaService) {}

  public async createJob(
    fileId: string,
    totalRows: number,
  ): Promise<JobStatus> {
    const job = await this.prisma.importJob.create({
      data: {
        file_id: fileId,
        status: PrismaJobStatus.PENDING,
        total_rows: totalRows,
        processed_rows: 0,
        error_rows: 0,
        errors: [],
      },
    });

    return this.mapToJobStatus(job);
  }

  public async updateJobStatus(
    jobId: string,
    status: PrismaJobStatus,
    stats?: {
      processed_rows?: number;
      error_rows?: number;
      errors?: string[];
    },
  ): Promise<JobStatus> {
    const job = await this.prisma.importJob.update({
      where: { id: jobId },
      data: {
        status,
        ...stats,
      },
    });

    return this.mapToJobStatus(job);
  }

  public async getJob(jobId: string): Promise<JobStatus | null> {
    const job = await this.prisma.importJob.findUnique({
      where: { id: jobId },
    });

    return job ? this.mapToJobStatus(job) : null;
  }

  public async cleanupOldJobs(hoursOld = 24): Promise<number> {
    const MILLIS_PER_HOUR = 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - hoursOld * MILLIS_PER_HOUR);

    const result = await this.prisma.importJob.deleteMany({
      where: {
        started_at: {
          lt: cutoffDate,
        },
        status: {
          in: [PrismaJobStatus.COMPLETED, PrismaJobStatus.FAILED],
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old import jobs`);
    return result.count;
  }

  private mapToJobStatus(job: {
    id: string;
    file_id: string;
    status: PrismaJobStatus;
    total_rows: number | null;
    processed_rows: number;
    error_rows: number;
    errors: unknown;
    started_at: Date;
    completed_at: Date | null;
  }): JobStatus {
    return {
      id: job.id,
      file_id: job.file_id,
      status: job.status,
      total_rows: job.total_rows,
      processed_rows: job.processed_rows,
      error_rows: job.error_rows,
      errors: job.errors as string[],
      started_at: job.started_at,
      completed_at: job.completed_at,
    };
  }
}
