import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PipelineRepository } from '../repositories/pipeline.repository';
import {
  ImportJob,
  JobStatus as PrismaJobStatus,
  Prisma,
} from '@prisma/client';
import { JobStatus } from '../interfaces/pipeline-types';

const CONSTANTS = {
  DEFAULT_LIMIT: 50,
  CLEANUP_HOURS: 24,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  MILLISECONDS_PER_SECOND: 1000,
};

/**
 * Pipeline Job Service
 * Handles business logic for managing import jobs
 * Following Rule #1: Services only contain business rules - no data access
 */
@Injectable()
export class PipelineJobService {
  private readonly logger = new Logger(PipelineJobService.name);

  public constructor(private readonly pipelineRepository: PipelineRepository) {}

  /**
   * Create a new import job
   */
  public async createImportJob(
    fileId: string,
    createdBy?: string,
  ): Promise<string> {
    this.logger.debug(`Creating import job for file: ${fileId}`);

    const job = await this.pipelineRepository.createImportJob({
      file_id: fileId,
      status: 'PENDING',
      created_by: createdBy,
    });

    this.logger.log(`Created import job: ${job.id}`);
    return job.id;
  }

  /**
   * Get job status with progress information
   */
  public async getJobStatus(jobId: string): Promise<JobStatus> {
    const job = await this.pipelineRepository.findImportJobById(jobId);
    this.validateJobExists(job, jobId);
    return this.mapJobToStatus(job);
  }

  private validateJobExists(
    job: ImportJob | null,
    jobId: string,
  ): asserts job is ImportJob {
    if (!job) {
      throw new NotFoundException(`Import job ${jobId} not found`);
    }
  }

  private mapJobToStatus(job: ImportJob): JobStatus {
    const rows = this.calculateRowCounts(job);
    return {
      id: job.id,
      fileName: job.file_id,
      status: job.status,
      totalRows: rows.total,
      validRows: rows.valid,
      invalidRows: rows.invalid,
      processedRows: rows.processed,
      errors: this.extractErrors(job.errors),
      created_at: job.started_at,
      updated_at: job.completed_at || job.started_at,
    };
  }

  private calculateRowCounts(job: ImportJob): {
    total: number;
    valid: number;
    invalid: number;
    processed: number;
  } {
    const total = job.total_rows || 0;
    const invalid = job.error_rows || 0;
    return {
      total,
      valid: total - invalid,
      invalid,
      processed: job.processed_rows || 0,
    };
  }

  private extractErrors(errors: unknown): string[] {
    return Array.isArray(errors) ? (errors as string[]) : [];
  }

  /**
   * Update job status with optional error information
   */
  public async updateJobStatus(
    jobId: string,
    status: PrismaJobStatus,
    errors?: string[],
    metadata?: {
      total_rows?: number;
      processed_rows?: number;
      error_rows?: number;
    },
  ): Promise<void> {
    this.logger.debug(`Updating job ${jobId} status to: ${status}`);

    const updateData: Prisma.ImportJobUpdateInput = {
      status,
      errors,
      completed_at: status !== 'RUNNING' ? new Date() : undefined,
      ...metadata,
    };

    await this.pipelineRepository.updateImportJob(jobId, updateData);
  }

  /**
   * List recent import jobs
   */
  public async listJobs(
    limit: number = CONSTANTS.DEFAULT_LIMIT,
  ): Promise<ImportJob[]> {
    return await this.pipelineRepository.findImportJobs(limit);
  }

  /**
   * Delete old completed/failed jobs
   */
  public async cleanupOldJobs(
    olderThanHours: number = CONSTANTS.CLEANUP_HOURS,
  ): Promise<{
    jobsDeleted: number;
    stagingRecordsDeleted: number;
  }> {
    const cutoffDate = this.calculateCutoffDate(olderThanHours);
    const jobsToDelete = await this.findOldJobIds(cutoffDate);

    if (jobsToDelete.length === 0) {
      return { jobsDeleted: 0, stagingRecordsDeleted: 0 };
    }

    return await this.deleteJobsAndRecords(jobsToDelete);
  }

  private calculateCutoffDate(olderThanHours: number): Date {
    const milliseconds =
      olderThanHours *
      CONSTANTS.SECONDS_PER_MINUTE *
      CONSTANTS.MINUTES_PER_HOUR *
      CONSTANTS.MILLISECONDS_PER_SECOND;
    return new Date(Date.now() - milliseconds);
  }

  private async findOldJobIds(cutoffDate: Date): Promise<string[]> {
    const oldJobs = await this.pipelineRepository.findImportJobs();
    return oldJobs
      .filter((job) => this.isJobEligibleForDeletion(job, cutoffDate))
      .map((job) => job.id);
  }

  private isJobEligibleForDeletion(job: ImportJob, cutoffDate: Date): boolean {
    return (
      job.completed_at !== null &&
      job.completed_at < cutoffDate &&
      ['COMPLETED', 'FAILED'].includes(job.status)
    );
  }

  private async deleteJobsAndRecords(
    jobIds: string[],
  ): Promise<{ jobsDeleted: number; stagingRecordsDeleted: number }> {
    const stagingResult = await this.pipelineRepository.deleteStagingAssets({
      id: { in: jobIds },
    });

    const jobsResult = await this.pipelineRepository.deleteImportJobs({
      id: { in: jobIds },
    });

    this.logCleanupResults(jobsResult.count, stagingResult.count);

    return {
      jobsDeleted: jobsResult.count,
      stagingRecordsDeleted: stagingResult.count,
    };
  }

  private logCleanupResults(
    jobsDeleted: number,
    stagingRecordsDeleted: number,
  ): void {
    this.logger.log(
      `Cleanup completed: ${jobsDeleted} jobs, ${stagingRecordsDeleted} staging records deleted`,
    );
  }

  /**
   * Clear all import jobs and staging data (emergency cleanup)
   */
  public async clearAllJobs(): Promise<{
    jobsDeleted: number;
    stagingRecordsDeleted: number;
    logsDeleted: number;
  }> {
    // Get all job IDs for deletion
    const allJobs = await this.pipelineRepository.findImportJobs();
    const allJobIds = allJobs.map((job) => job.id);

    // Delete all staging records first (foreign key constraint)
    const stagingRecordsDeleted =
      allJobIds.length > 0
        ? await this.pipelineRepository.deleteStagingAssets({
            id: { in: allJobIds },
          })
        : { count: 0 };

    // Delete all import jobs
    const jobsDeleted =
      allJobIds.length > 0
        ? await this.pipelineRepository.deleteImportJobs({
            id: { in: allJobIds },
          })
        : { count: 0 };

    // Clear all logs
    const logsDeleted = await this.pipelineRepository.deleteLogEntries();

    this.logger.warn(
      `Emergency cleanup: ${jobsDeleted.count} jobs, ${stagingRecordsDeleted.count} staging records, ${logsDeleted.count} logs deleted`,
    );

    return {
      jobsDeleted: jobsDeleted.count,
      stagingRecordsDeleted: stagingRecordsDeleted.count,
      logsDeleted: logsDeleted.count,
    };
  }
}
