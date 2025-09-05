import { Injectable, Logger } from '@nestjs/common';
import {
  Prisma,
  PipelineRule,
  PipelinePhase,
  RuleType,
  ImportJob,
  StagingAsset,
} from '@prisma/client';

const DEFAULTS = {
  DEFAULT_LIMIT: 50,
};
import { PrismaService } from '../../database/prisma.service';

export interface CreateRuleData {
  name: string;
  description: string;
  phase: PipelinePhase;
  type: RuleType;
  target: string;
  config: Prisma.InputJsonValue;
  priority: number;
  is_active?: boolean;
}

export interface UpdateRuleData {
  name?: string;
  description?: string;
  phase?: PipelinePhase;
  type?: RuleType;
  target?: string;
  config?: Prisma.InputJsonValue;
  priority?: number;
  is_active?: boolean;
}

@Injectable()
export class PipelineRepository {
  private readonly logger = new Logger(PipelineRepository.name);

  public constructor(private readonly prisma: PrismaService) {}

  // Rule CRUD operations
  public async createRule(data: CreateRuleData): Promise<PipelineRule> {
    this.logger.debug(`Creating rule: ${data.name}`);

    return await this.prisma.pipelineRule.create({
      data: {
        ...data,
        is_active: data.is_active ?? true,
      },
    });
  }

  public async getRuleById(id: string): Promise<PipelineRule | null> {
    return await this.prisma.pipelineRule.findUnique({
      where: { id },
    });
  }

  public async getRulesByPhase(
    phase: PipelinePhase,
    activeOnly: boolean = true,
  ): Promise<PipelineRule[]> {
    const where: Prisma.PipelineRuleWhereInput = { phase };
    if (activeOnly) {
      where.is_active = true;
    }

    return await this.prisma.pipelineRule.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { created_at: 'asc' }],
    });
  }

  public async getAllRules(): Promise<PipelineRule[]> {
    return await this.prisma.pipelineRule.findMany({
      orderBy: [{ phase: 'asc' }, { priority: 'asc' }, { name: 'asc' }],
    });
  }

  public async updateRule(
    id: string,
    data: UpdateRuleData,
  ): Promise<PipelineRule> {
    this.logger.debug(`Updating rule: ${id}`);

    return await this.prisma.pipelineRule.update({
      where: { id },
      data,
    });
  }

  public async deleteRule(id: string): Promise<void> {
    this.logger.debug(`Deleting rule: ${id}`);

    await this.prisma.pipelineRule.delete({
      where: { id },
    });
  }

  // Import Job operations
  public async getJobById(id: string): Promise<ImportJob | null> {
    return await this.prisma.importJob.findUnique({
      where: { id },
    });
  }

  public async getAllJobs(
    limit: number = DEFAULTS.DEFAULT_LIMIT,
  ): Promise<ImportJob[]> {
    return await this.prisma.importJob.findMany({
      orderBy: { started_at: 'desc' },
      take: limit,
    });
  }

  public async createJob(
    fileId: string,
    createdBy?: string,
  ): Promise<ImportJob> {
    return await this.prisma.importJob.create({
      data: {
        file_id: fileId,
        status: 'PENDING',
        created_by: createdBy,
      },
    });
  }

  public async createImportJob(data: {
    file_id: string;
    status: string;
    created_by?: string;
  }): Promise<ImportJob> {
    return await this.prisma.importJob.create({
      data: {
        ...data,
        status: data.status as Prisma.ImportJobCreateInput['status'],
      },
    });
  }

  public async findImportJobById(id: string): Promise<ImportJob | null> {
    return this.getJobById(id);
  }

  public async findImportJobs(limit?: number): Promise<ImportJob[]> {
    return this.getAllJobs(limit);
  }

  public async updateImportJob(
    id: string,
    data: Prisma.ImportJobUpdateInput,
  ): Promise<ImportJob> {
    return await this.prisma.importJob.update({
      where: { id },
      data,
    });
  }

  public async deleteImportJobs(
    where: Prisma.ImportJobWhereInput,
  ): Promise<{ count: number }> {
    return await this.prisma.importJob.deleteMany({ where });
  }

  public async deleteStagingAssets(
    where: Prisma.StagingAssetWhereInput,
  ): Promise<{ count: number }> {
    return await this.prisma.stagingAsset.deleteMany({ where });
  }

  public async deleteLogEntries(): Promise<{ count: number }> {
    return await this.prisma.logEntry.deleteMany({});
  }

  // Additional methods for pipeline services compatibility
  public async createStagingAssets(
    data: Prisma.StagingAssetCreateManyInput[],
  ): Promise<void> {
    await this.createManyStagingAssets(data);
  }

  public async createAssets(
    data: Prisma.AssetCreateManyInput[],
  ): Promise<{ count: number }> {
    return await this.prisma.asset.createMany({ data });
  }

  public async createAsset(data: Prisma.AssetCreateInput): Promise<unknown> {
    return await this.prisma.asset.create({ data });
  }

  public async countStagingAssetsByCondition(
    where: Prisma.StagingAssetWhereInput,
  ): Promise<number> {
    return await this.prisma.stagingAsset.count({ where });
  }

  public async updateJobStatus(
    id: string,
    status: string,
    errors?: string[],
    metadata?: Record<string, unknown>,
  ): Promise<ImportJob> {
    return await this.prisma.importJob.update({
      where: { id },
      data: {
        status: status as Prisma.ImportJobCreateInput['status'],
        errors,
        completed_at: ['COMPLETED', 'FAILED'].includes(status)
          ? new Date()
          : undefined,
        ...(metadata &&
          Object.keys(metadata).length > 0 && {
            total_rows: metadata.totalRows as number,
            processed_rows: metadata.processedRows as number,
            error_rows: metadata.errorRows as number,
          }),
      },
    });
  }

  // Staging Asset operations
  public async getStagingAssetsByJob(
    jobId: string,
    limit?: number,
  ): Promise<StagingAsset[]> {
    return await this.prisma.stagingAsset.findMany({
      where: { import_job_id: jobId },
      orderBy: { row_number: 'asc' },
      ...(limit && { take: limit }),
    });
  }

  public async countStagingAssets(
    jobId: string,
    validOnly?: boolean,
  ): Promise<number> {
    const where: Prisma.StagingAssetWhereInput = { import_job_id: jobId };
    if (validOnly !== undefined) {
      where.is_valid = validOnly;
    }

    return await this.prisma.stagingAsset.count({ where });
  }

  public async createManyStagingAssets(
    data: Prisma.StagingAssetCreateManyInput[],
  ): Promise<{ count: number }> {
    return await this.prisma.stagingAsset.createMany({ data });
  }

  public async deleteStagingAssetsByJob(
    jobId: string,
  ): Promise<{ count: number }> {
    return await this.prisma.stagingAsset.deleteMany({
      where: { import_job_id: jobId },
    });
  }

  // Cleanup operations
  public async cleanupOldJobs(
    olderThanDate: Date,
  ): Promise<{ jobsDeleted: number; stagingDeleted: number }> {
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

  public async clearAllData(): Promise<{
    jobsDeleted: number;
    stagingDeleted: number;
    logsDeleted: number;
  }> {
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

  public async findStagingAssets(
    jobId: string,
    limit?: number,
  ): Promise<StagingAsset[]> {
    return this.getStagingAssetsByJob(jobId, limit);
  }

  public getPrismaClient(): PrismaService {
    return this.prisma;
  }

  // Asset column aliases operations
  public async getAssetColumnAliases(): Promise<
    Array<{
      asset_field: string;
      csv_alias: string;
      confidence: number;
    }>
  > {
    const aliases = await this.prisma.assetColumnAlias.findMany({
      select: {
        asset_field: true,
        csv_alias: true,
        confidence: true,
      },
      orderBy: {
        confidence: 'desc',
      },
    });

    return aliases.map((alias) => ({
      asset_field: alias.asset_field,
      csv_alias: alias.csv_alias,
      confidence: Number(alias.confidence),
    }));
  }

  // Asset Column Aliases CRUD Methods

  public async getAllAssetColumnAliases(): Promise<
    Array<{
      id: string;
      asset_field: string;
      csv_alias: string;
      confidence: unknown;
      created_at: Date;
      created_by: string | null;
    }>
  > {
    this.logger.debug('Retrieving all asset column aliases with full details');

    const aliases = await this.prisma.assetColumnAlias.findMany({
      orderBy: {
        confidence: 'desc',
      },
    });

    return aliases.map((alias) => ({
      id: alias.id,
      asset_field: alias.asset_field,
      csv_alias: alias.csv_alias,
      confidence: alias.confidence,
      created_at: alias.created_at,
      created_by: alias.created_by,
    }));
  }

  public async createAssetColumnAlias(data: {
    asset_field: string;
    csv_alias: string;
    confidence: number;
    created_by: string;
  }): Promise<{
    id: string;
    asset_field: string;
    csv_alias: string;
    confidence: unknown;
  }> {
    this.logger.debug(`Creating asset column alias: ${data.csv_alias}`);

    const alias = await this.prisma.assetColumnAlias.create({
      data: {
        asset_field: data.asset_field,
        csv_alias: data.csv_alias,
        confidence: data.confidence,
        created_by: data.created_by,
      },
    });

    return {
      id: alias.id,
      asset_field: alias.asset_field,
      csv_alias: alias.csv_alias,
      confidence: alias.confidence,
    };
  }

  public async updateAssetColumnAlias(
    aliasId: string,
    data: Record<string, unknown>,
  ): Promise<{
    id: string;
    asset_field: string;
    csv_alias: string;
    confidence: unknown;
  }> {
    this.logger.debug(`Updating asset column alias: ${aliasId}`);

    const alias = await this.prisma.assetColumnAlias.update({
      where: { id: aliasId },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });

    return {
      id: alias.id,
      asset_field: alias.asset_field,
      csv_alias: alias.csv_alias,
      confidence: alias.confidence,
    };
  }

  public async deleteAssetColumnAlias(aliasId: string): Promise<void> {
    this.logger.debug(`Deleting asset column alias: ${aliasId}`);

    await this.prisma.assetColumnAlias.delete({
      where: { id: aliasId },
    });
  }
}
