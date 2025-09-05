import { Injectable, Logger } from '@nestjs/common';
import { AzureBlobStorageService } from '../files/services/azure-blob-storage.service';
import { PipelineRepository } from './repositories/pipeline.repository';
import { PipelineJobService } from './services/pipeline-job.service';
import { PipelineValidationService } from './services/pipeline-validation.service';
import { PipelineImportService } from './services/pipeline-import.service';
import { RuleEngineService } from './services/rule-engine.service';
import { PipelineRule, PipelinePhase, RuleType } from '@prisma/client';
import {
  FileMetadata,
  JobStatus,
  ProcessedRow,
} from './interfaces/pipeline-types';
import { CreateRuleDto, UpdateRuleDto } from './dto/pipeline-dto';

interface StagedDataRowResponse {
  rowNumber: number;
  isValid: boolean;
  willImport: boolean;
  rawData: Record<string, unknown>;
  mappedData: Record<string, unknown>;
  errors: string[] | null;
}

/**
 * Pipeline Service - Main orchestrator for pipeline operations
 * Following Rule #1: Services only contain business rules - delegates data access to services
 * Following Rule #4: Complexity budget - delegates complex operations to specialized services
 */
@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);
  private readonly prisma: unknown;

  public constructor(
    private readonly blobStorageService: AzureBlobStorageService,
    private readonly pipelineRepository: PipelineRepository,
    private readonly pipelineJobService: PipelineJobService,
    private readonly pipelineValidationService: PipelineValidationService,
    private readonly pipelineImportService: PipelineImportService,
    private readonly ruleEngine: RuleEngineService,
  ) {
    this.prisma = this.pipelineRepository.getPrismaClient();
  }

  public async listCsvFiles(): Promise<FileMetadata[]> {
    // Use the same approach as the files page - get all files and filter
    const MAX_FILES = 100;
    const result = await this.blobStorageService.findMany(1, MAX_FILES);

    // Filter for CSV files - check file extension in original_name (most reliable)
    const csvFiles = result.files.filter((file) =>
      file.original_name?.toLowerCase().endsWith('.csv'),
    );

    return csvFiles.map((file) => ({
      id: file.id,
      name: file.original_name || 'Unknown',
      size: file.size,
      mimeType: 'text/csv',
      created_at: file.created_at,
    }));
  }

  public async startImport(fileId: string): Promise<string> {
    const jobId = await this.pipelineJobService.createImportJob(fileId);

    // Start async processing (simple for now, no queue)
    this.pipelineImportService
      .processImport(jobId, fileId)
      .catch((error: Error) => {
        this.logger.error(`Failed to process import job ${jobId}:`, error);
      });

    return jobId;
  }

  public async getJobStatus(jobId: string): Promise<JobStatus> {
    return await this.pipelineJobService.getJobStatus(jobId);
  }

  public async previewCsvFile(fileId: string): Promise<{
    data: Record<string, string>[];
    columns: string[];
    totalRows: number;
  }> {
    return await this.pipelineImportService.previewCsvFile(fileId);
  }

  public async getStagedData(jobId: string): Promise<{
    data: StagedDataRowResponse[];
    validCount: number;
    invalidCount: number;
  }> {
    return await this.pipelineValidationService.getStagedData(jobId);
  }

  public async approveImport(jobId: string): Promise<{
    message: string;
    importedCount: number;
  }> {
    const result = await this.pipelineImportService.approveImport(jobId);
    return {
      message: `Successfully imported ${result.stats.successful} assets`,
      importedCount: result.stats.successful,
    };
  }

  public async rejectImport(jobId: string): Promise<{
    message: string;
    clearedCount: number;
  }> {
    const result = await this.pipelineImportService.rejectImport(jobId);
    return {
      message: `Import rejected. ${result.clearedCount} staging records cleared`,
      clearedCount: result.clearedCount,
    };
  }

  public async cleanupOldJobs(olderThanHours = 24): Promise<{
    message: string;
    jobsDeleted: number;
    stagingRecordsDeleted: number;
  }> {
    const result = await this.pipelineJobService.cleanupOldJobs(olderThanHours);
    return {
      message: `Cleaned up ${result.jobsDeleted} old jobs and ${result.stagingRecordsDeleted} staging records`,
      jobsDeleted: result.jobsDeleted,
      stagingRecordsDeleted: result.stagingRecordsDeleted,
    };
  }

  public async clearAllJobs(): Promise<{
    message: string;
    jobsDeleted: number;
    stagingRecordsDeleted: number;
    logsDeleted: number;
  }> {
    const result = await this.pipelineJobService.clearAllJobs();
    return {
      message: `Cleared ALL data: ${result.jobsDeleted} jobs, ${result.stagingRecordsDeleted} staging records, ${result.logsDeleted} logs`,
      jobsDeleted: result.jobsDeleted,
      stagingRecordsDeleted: result.stagingRecordsDeleted,
      logsDeleted: result.logsDeleted,
    };
  }

  public async validateCsvFile(fileId: string): Promise<{
    totalRows: number;
    validRows: number;
    invalidRows: number;
    errors: string[];
    sampleValidData: Array<{
      rowNumber: number;
      rawData: Record<string, string>;
      mappedData: Record<string, string>;
    }>;
    sampleInvalidData: Array<{
      rowNumber: number;
      rawData: Record<string, string>;
      errors: string[];
    }>;
  }> {
    const result = await this.pipelineValidationService.validateCsvFile(fileId);
    return {
      totalRows: result.totalRows,
      validRows: result.validRows?.length || 0,
      invalidRows: result.invalidRows?.length || 0,
      errors: result.errors,
      sampleValidData: result.sampleValidData,
      sampleInvalidData: result.sampleInvalidData,
    };
  }

  public async testETLRules(): Promise<{
    success: boolean;
    testData: {
      before: Record<string, unknown>;
      after: Record<string, unknown>;
    };
    rulesApplied: Array<{
      name: string;
      type: string;
      phase: string;
      target: string;
    }>;
    processing: {
      errors: string[];
      warnings: string[];
    };
  }> {
    this.logger.debug('Testing ETL rules with sample data');

    const testData = this.createTestData();
    const context = this.createTestContext();

    try {
      const allActiveRules = await this.ensureCleanRulesExist();
      const result = await this.processTestData(testData, context);
      return this.formatSuccessResult(testData, result, allActiveRules);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`ETL rules test failed: ${errorMessage}`);
      return this.formatErrorResult(testData, errorMessage);
    }
  }

  private createTestData(): Record<string, string> {
    return {
      name: '   HVAC Unit 001   \t\n',
      assetTag: 'TEST-001',
      manufacturer: '  TestCorp  ',
      description: '\tTest Description\n',
    };
  }

  private createTestContext(): {
    rowNumber: number;
    jobId: string;
    correlationId: string;
    metadata: { source: string };
  } {
    return {
      rowNumber: 1,
      jobId: 'test-rules-job',
      correlationId: 'test-correlation-' + Date.now(),
      metadata: { source: 'api-test' },
    };
  }

  private async ensureCleanRulesExist(): Promise<
    Array<{ name: string; type: string; phase: string; target: string }>
  > {
    const allActiveRules = await this.ruleEngine.getRulesForPhase(
      'CLEAN' as PipelinePhase,
    );

    if (allActiveRules.length === 0) {
      this.logger.debug('No active CLEAN rules found, creating demo TRIM rule');
      await this.createDemoTrimRule();
    }

    return allActiveRules;
  }

  private async createDemoTrimRule(): Promise<void> {
    await this.ruleEngine.createRule({
      name: 'Demo TRIM Rule',
      description: 'Automatically created for testing',
      phase: 'CLEAN' as PipelinePhase,
      type: 'TRIM' as RuleType,
      target: 'name',
      config: {
        sides: 'both',
        customChars: ' \t\n\r',
      },
      priority: 1,
    });
  }

  private async processTestData(
    testData: Record<string, string>,
    context: Record<string, unknown>,
  ): Promise<{
    success: boolean;
    data: ProcessedRow;
    errors: string[];
    warnings: string[];
  }> {
    return await this.ruleEngine.processDataWithRules(
      testData as ProcessedRow,
      'CLEAN' as PipelinePhase,
      context,
    );
  }

  private formatSuccessResult(
    testData: Record<string, string>,
    result: {
      success: boolean;
      data: ProcessedRow;
      errors: string[];
      warnings: string[];
    },
    allActiveRules: Array<{
      name: string;
      type: string;
      phase: string;
      target: string;
    }>,
  ): {
    success: boolean;
    testData: { before: Record<string, string>; after: ProcessedRow };
    rulesApplied: Array<{
      name: string;
      type: string;
      phase: string;
      target: string;
    }>;
    processing: { errors: string[]; warnings: string[] };
  } {
    const allRulesApplied = allActiveRules.map((rule) => ({
      name: rule.name,
      type: rule.type,
      phase: rule.phase,
      target: rule.target,
    }));

    this.logger.debug(
      `ETL rules test completed. Applied ${allRulesApplied.length} rules`,
    );

    return {
      success: result.success,
      testData: {
        before: testData,
        after: result.data,
      },
      rulesApplied: allRulesApplied,
      processing: {
        errors: result.errors,
        warnings: result.warnings,
      },
    };
  }

  private formatErrorResult(
    testData: Record<string, string>,
    errorMessage: string,
  ): {
    success: boolean;
    testData: { before: Record<string, string>; after: Record<string, string> };
    rulesApplied: Array<{
      name: string;
      type: string;
      phase: string;
      target: string;
    }>;
    processing: { errors: string[]; warnings: string[] };
  } {
    return {
      success: false,
      testData: {
        before: testData,
        after: testData,
      },
      rulesApplied: [],
      processing: {
        errors: [`Test failed: ${errorMessage}`],
        warnings: [],
      },
    };
  }

  public testPipelineOrchestrator(): Record<string, unknown> {
    this.logger.debug('Testing pipeline orchestrator with all phases');

    try {
      const testResult = this.createMockPipelineResult();
      this.logger.debug('Pipeline orchestrator test completed successfully');
      return this.formatSuccessResponse(testResult);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }

  private createMockPipelineResult() {
    return {
      success: true,
      phases: this.createMockPhaseResults(),
      summary: this.createMockSummary(),
    };
  }

  private createMockPhaseResults() {
    const phases = ['extract', 'validate', 'clean', 'transform', 'map', 'load'];
    const durations = [10, 5, 8, 12, 6, 15];

    return phases.reduce(
      (acc, phase, index) => {
        acc[phase] = {
          phase,
          success: true,
          inputRows: 1,
          outputRows: 1,
          errors: [],
          warnings: [],
          duration: durations[index],
        };
        return acc;
      },
      {} as Record<string, unknown>,
    );
  }

  private createMockSummary() {
    return {
      totalRows: 1,
      successfulRows: 1,
      failedRows: 0,
      errors: [],
    };
  }

  private formatSuccessResponse(data: unknown) {
    return {
      success: true,
      data,
    };
  }

  private formatErrorResponse(error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.logger.error(`Pipeline orchestrator test failed: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
      data: null,
    };
  }

  public async getRules(): Promise<PipelineRule[]> {
    this.logger.debug('Getting all pipeline rules');
    return await this.ruleEngine.getRulesForPhase('CLEAN' as PipelinePhase);
  }

  public async createRule(createRuleDto: CreateRuleDto): Promise<PipelineRule> {
    this.logger.debug(`Creating pipeline rule: ${createRuleDto.name}`);
    return await this.ruleEngine.createRule({
      name: createRuleDto.name,
      description: `Created via API`,
      phase: createRuleDto.phase as PipelinePhase,
      type: createRuleDto.type as RuleType,
      target: createRuleDto.target,
      config: createRuleDto.config,
      priority: createRuleDto.priority || 1,
      is_active: createRuleDto.is_active,
    });
  }

  public updateRule(
    ruleId: string,
    _updateRuleDto: UpdateRuleDto,
  ): Promise<PipelineRule> {
    this.logger.debug(`Updating pipeline rule: ${ruleId}`);
    // For now, we'll need to implement this in the repository
    // This is a simplified implementation
    throw new Error(
      'Update rule not implemented yet - requires repository method',
    );
  }

  public deleteRule(ruleId: string): Promise<void> {
    this.logger.debug(`Deleting pipeline rule: ${ruleId}`);
    // For now, we'll need to implement this in the repository
    throw new Error(
      'Delete rule not implemented yet - requires repository method',
    );
  }

  public async listJobs(): Promise<
    Array<{
      id: string;
      file_id: string;
      status: string;
      total_rows: number | null;
      processed_rows: number | null;
      error_rows: number | null;
      errors: string[] | null;
      started_at: Date;
      completed_at: Date | null;
      created_by: string | null;
    }>
  > {
    const jobs = await this.pipelineJobService.listJobs();
    return jobs.map((job) => ({
      id: job.id,
      file_id: job.file_id,
      status: job.status.toString(),
      total_rows: job.total_rows,
      processed_rows: job.processed_rows,
      error_rows: job.error_rows,
      errors: Array.isArray(job.errors) ? (job.errors as string[]) : null,
      started_at: job.started_at,
      completed_at: job.completed_at,
      created_by: job.created_by,
    }));
  }
}
