import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PipelineRule, PipelinePhase, RuleType, ImportJob, StagingAsset } from '@prisma/client';

export interface CreateRuleData {
  name: string;
  description: string;
  phase: PipelinePhase;
  type: RuleType;
  target: string;
  config: Record<string, unknown>;
  priority: number;
  is_active?: boolean;
}

export interface UpdateRuleData {
  name?: string;
  description?: string;
  phase?: PipelinePhase;
  type?: RuleType;
  target?: string;
  config?: Record<string, unknown>;
  priority?: number;
  is_active?: boolean;
}

@Injectable()
export class PipelineRepository {
  private readonly logger = new Logger(PipelineRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // Rule CRUD operations
  async createRule(data: CreateRuleData): Promise<PipelineRule> {
    this.logger.debug(`Creating rule: ${data.name}`);
    
    return await this.prisma.pipelineRule.create({
      data: {
        ...data,
        is_active: data.is_active ?? true,
      },
    });
  }

  async getRuleById(id: string): Promise<PipelineRule | null> {
    return await this.prisma.pipelineRule.findUnique({
      where: { id },
    });
  }

  async getRulesByPhase(phase: PipelinePhase, activeOnly: boolean = true): Promise<PipelineRule[]> {
    const where: any = { phase };
    if (activeOnly) {
      where.is_active = true;
    }

    return await this.prisma.pipelineRule.findMany({
      where,
      orderBy: [
        { priority: 'asc' },
        { created_at: 'asc' },
      ],
    });
  }

  async getAllRules(): Promise<PipelineRule[]> {
    return await this.prisma.pipelineRule.findMany({
      orderBy: [
        { phase: 'asc' },
        { priority: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  async updateRule(id: string, data: UpdateRuleData): Promise<PipelineRule> {
    this.logger.debug(`Updating rule: ${id}`);
    
    return await this.prisma.pipelineRule.update({
      where: { id },
      data,
    });
  }

  async deleteRule(id: string): Promise<void> {
    this.logger.debug(`Deleting rule: ${id}`);
    
    await this.prisma.pipelineRule.delete({
      where: { id },
    });
  }

  // Import Job operations
  async getJobById(id: string): Promise<ImportJob | null> {
    return await this.prisma.importJob.findUnique({
      where: { id },
    });
  }

  async getAllJobs(limit: number = 50): Promise<ImportJob[]> {
    return await this.prisma.importJob.findMany({
      orderBy: { started_at: 'desc' },
      take: limit,
    });
  }

  async createJob(fileId: string, createdBy?: string): Promise<ImportJob> {
    return await this.prisma.importJob.create({
      data: {
        file_id: fileId,
        status: 'PENDING',
        created_by: createdBy,
      },
    });
  }

  async updateJobStatus(
    id: string, 
    status: string, 
    errors?: string[], 
    metadata?: Record<string, unknown>
  ): Promise<ImportJob> {
    return await this.prisma.importJob.update({
      where: { id },
      data: {
        status: status as any,
        errors,
        completed_at: ['COMPLETED', 'FAILED'].includes(status) ? new Date() : undefined,
        ...(metadata && Object.keys(metadata).length > 0 && { 
          total_rows: metadata.totalRows as number,
          processed_rows: metadata.processedRows as number,
          error_rows: metadata.errorRows as number,
        }),
      },
    });
  }

  // Staging Asset operations
  async getStagingAssetsByJob(jobId: string, limit?: number): Promise<StagingAsset[]> {
    return await this.prisma.stagingAsset.findMany({
      where: { import_job_id: jobId },
      orderBy: { row_number: 'asc' },
      ...(limit && { take: limit }),
    });
  }

  async countStagingAssets(jobId: string, validOnly?: boolean): Promise<number> {
    const where: any = { import_job_id: jobId };
    if (validOnly !== undefined) {
      where.is_valid = validOnly;
    }

    return await this.prisma.stagingAsset.count({ where });
  }

  async createManyStagingAssets(data: any[]): Promise<{ count: number }> {
    return await this.prisma.stagingAsset.createMany({ data });
  }

  async deleteStagingAssetsByJob(jobId: string): Promise<{ count: number }> {
    return await this.prisma.stagingAsset.deleteMany({
      where: { import_job_id: jobId },
    });
  }

  // Cleanup operations
  async cleanupOldJobs(olderThanDate: Date): Promise<{ jobsDeleted: number; stagingDeleted: number }> {
    // Find old completed/failed jobs
    const oldJobs = await this.prisma.importJob.findMany({
      where: {
        completed_at: { lt: olderThanDate },
        status: { in: ['COMPLETED', 'FAILED'] },
      },
      select: { id: true },
    });

    if (oldJobs.length === 0) {
      return { jobsDeleted: 0, stagingDeleted: 0 };
    }

    const jobIds = oldJobs.map((job) => job.id);

    // Delete staging records first (foreign key constraint)
    const stagingDeleted = await this.prisma.stagingAsset.deleteMany({
      where: { import_job_id: { in: jobIds } },
    });

    // Delete import jobs
    const jobsDeleted = await this.prisma.importJob.deleteMany({
      where: { id: { in: jobIds } },
    });

    return {
      jobsDeleted: jobsDeleted.count,
      stagingDeleted: stagingDeleted.count,
    };
  }

  async clearAllData(): Promise<{ jobsDeleted: number; stagingDeleted: number; logsDeleted: number }> {
    // Delete all staging records first (foreign key constraint)
    const stagingDeleted = await this.prisma.stagingAsset.deleteMany({});
    
    // Delete all import jobs
    const jobsDeleted = await this.prisma.importJob.deleteMany({});
    
    // Clear all logs too
    const logsDeleted = await this.prisma.logEntry.deleteMany({});

    return {
      jobsDeleted: jobsDeleted.count,
      stagingDeleted: stagingDeleted.count,
      logsDeleted: logsDeleted.count,
    };
  }
}