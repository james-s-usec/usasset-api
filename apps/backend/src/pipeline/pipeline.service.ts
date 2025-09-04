import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AzureBlobStorageService } from '../files/services/azure-blob-storage.service';
import { CsvParserService } from './services/csv-parser.service';
import { PrismaService } from '../database/prisma.service';
import { RuleEngineService } from './services/rule-engine.service';
import { RuleProcessorFactory } from './services/rule-processor.factory';
import { PipelineOrchestrator } from './orchestrator/pipeline-orchestrator.service';
import { ExtractPhaseProcessor } from './phases/extract/extract-phase.processor';
import { ValidatePhaseProcessor } from './phases/validate/validate-phase.processor';
import { CleanPhaseProcessor } from './phases/clean/clean-phase.processor';
import { TransformPhaseProcessor } from './phases/transform/transform-phase.processor';
import { MapPhaseProcessor } from './phases/map/map-phase.processor';
import { LoadPhaseProcessor } from './phases/load/load-phase.processor';
import {
  JobStatus as PrismaJobStatus,
  AssetStatus,
  AssetCondition,
  Prisma,
} from '@prisma/client';

// Constants to eliminate magic numbers
const CONSTANTS = {
  HEADER_ROW_OFFSET: 2,
  MAX_STRING_LENGTH: 200,
  MAX_PREVIEW_STRING_LENGTH: 100,
  PREVIEW_ROWS_LIMIT: 10,
  VALIDATION_SAMPLE_SIZE: 50,
  MAX_SAMPLE_ITEMS: 5,
  MAX_ERROR_DISPLAY: 20,
  DEFAULT_CLEANUP_HOURS: 24,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  MILLISECONDS_PER_SECOND: 1000,
} as const;

// Computed constants
const MILLISECONDS_PER_HOUR =
  CONSTANTS.SECONDS_PER_MINUTE *
  CONSTANTS.MINUTES_PER_HOUR *
  CONSTANTS.MILLISECONDS_PER_SECOND;

interface FileInfo {
  id: string;
  name: string;
  size: number;
  created_at: Date;
}

interface JobStatus {
  id: string;
  status: string;
  progress?: {
    total: number;
    processed: number;
  };
  errors?: string[];
}

interface MappedAssetData {
  assetTag: string;
  name: string;
  description?: string;
  buildingName?: string;
  floor?: string;
  room?: string;
  status?: string;
  conditionAssessment?: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
}

interface StagedDataRowResponse {
  rowNumber: number;
  isValid: boolean;
  willImport: boolean;
  rawData: Record<string, unknown>;
  mappedData: Record<string, unknown>;
  errors: string[] | null;
}

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  private readonly ruleEngine: RuleEngineService;

  public constructor(
    private readonly blobStorageService: AzureBlobStorageService,
    private readonly csvParser: CsvParserService,
    private readonly prisma: PrismaService,
  ) {
    const ruleProcessorFactory = new RuleProcessorFactory();
    this.ruleEngine = new RuleEngineService(this.prisma, ruleProcessorFactory);
  }

  public async listCsvFiles(): Promise<FileInfo[]> {
    // Use the same approach as the files page - get all files and filter
    const MAX_FILES = 100;
    const result = await this.blobStorageService.findMany(1, MAX_FILES);

    // Filter for CSV files - check file extension in original_name (most reliable)
    const csvFiles = result.files.filter((file) =>
      file.original_name?.toLowerCase().endsWith('.csv'),
    );

    return csvFiles.map((file) => ({
      id: file.id,
      name: file.original_name,
      size: file.size,
      created_at: file.created_at,
    }));
  }

  public async startImport(fileId: string): Promise<string> {
    // Create the import job
    const job = await this.prisma.importJob.create({
      data: {
        file_id: fileId,
        status: 'PENDING',
      },
    });

    // Start async processing (simple for now, no queue)
    this.processImport(job.id, fileId).catch((error) => {
      this.logger.error(`Failed to process import job ${job.id}:`, error);
    });

    return job.id;
  }

  private async updateJobStatus(
    jobId: string,
    status: PrismaJobStatus,
    errors?: string[],
  ): Promise<void> {
    await this.prisma.importJob.update({
      where: { id: jobId },
      data: {
        status,
        errors,
        completed_at: status !== 'RUNNING' ? new Date() : undefined,
      },
    });
  }

  private validateAssetData(assetData: MappedAssetData): string[] {
    const validationErrors: string[] = [];

    if (!assetData.assetTag) {
      validationErrors.push('Missing required field: Asset Tag');
    }
    if (!assetData.name) {
      validationErrors.push('Missing required field: Name');
    }

    return validationErrors;
  }

  private addValidSample(
    validData: Array<{
      rowNumber: number;
      rawData: Record<string, string>;
      mappedData: Record<string, string>;
    }>,
    item: {
      rowNumber: number;
      rawData: Record<string, string>;
      mappedData: MappedAssetData;
    },
  ): void {
    if (validData.length < CONSTANTS.MAX_SAMPLE_ITEMS) {
      validData.push({
        rowNumber: item.rowNumber,
        rawData: item.rawData,
        mappedData: item.mappedData as unknown as Record<string, string>,
      });
    }
  }

  private addInvalidSample(
    invalidData: Array<{
      rowNumber: number;
      rawData: Record<string, string>;
      errors: string[];
    }>,
    item: {
      rowNumber: number;
      rawData: Record<string, string>;
      errors: string[];
    },
  ): void {
    if (invalidData.length < CONSTANTS.MAX_SAMPLE_ITEMS) {
      invalidData.push(item);
    }
  }

  private createStagingRecord(params: {
    jobId: string;
    rowIndex: number;
    row: Record<string, string>;
    assetData: MappedAssetData;
    validationErrors: string[];
  }): Prisma.StagingAssetCreateManyInput {
    const { jobId, rowIndex, row, assetData, validationErrors } = params;
    const isValid = validationErrors.length === 0;
    // Truncate large raw data values to prevent memory issues
    const truncatedRow: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      truncatedRow[key] =
        typeof value === 'string' && value.length > CONSTANTS.MAX_STRING_LENGTH
          ? value.substring(0, CONSTANTS.MAX_STRING_LENGTH) + '...'
          : value;
    }

    return {
      import_job_id: jobId,
      row_number: rowIndex + CONSTANTS.HEADER_ROW_OFFSET,
      raw_data: truncatedRow as unknown as Prisma.InputJsonValue,
      mapped_data: assetData as unknown as Prisma.InputJsonValue,
      validation_errors:
        validationErrors.length > 0
          ? (validationErrors as Prisma.InputJsonValue)
          : undefined,
      is_valid: isValid,
      will_import: isValid,
    };
  }

  private processCsvRows(
    jobId: string,
    rows: Record<string, string>[],
  ): {
    stagingAssets: Prisma.StagingAssetCreateManyInput[];
    errors: string[];
    processedCount: number;
  } {
    const errors: string[] = [];
    const stagingAssets: Prisma.StagingAssetCreateManyInput[] = [];
    let processedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        const assetData = this.mapRowToAsset(row);
        const validationErrors = this.validateAssetData(assetData);
        const stagingRecord = this.createStagingRecord({
          jobId,
          rowIndex: i,
          row,
          assetData,
          validationErrors,
        });

        stagingAssets.push(stagingRecord);

        if (validationErrors.length === 0) {
          processedCount++;
        } else {
          errors.push(
            `Row ${i + CONSTANTS.HEADER_ROW_OFFSET}: ${validationErrors.join(', ')}`,
          );
        }
      } catch (error) {
        errors.push(
          `Row ${i + CONSTANTS.HEADER_ROW_OFFSET}: Failed to process - ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return { stagingAssets, errors, processedCount };
  }

  private async processImport(jobId: string, fileId: string): Promise<void> {
    try {
      await this.updateJobStatus(jobId, PrismaJobStatus.RUNNING);

      const parseResult = await this.csvParser.parseFileFromBlob(fileId);

      if (parseResult.errors.length > 0 && parseResult.rows.length === 0) {
        await this.updateJobStatus(
          jobId,
          PrismaJobStatus.FAILED,
          parseResult.errors,
        );
        return;
      }

      const { stagingAssets, errors, processedCount } = this.processCsvRows(
        jobId,
        parseResult.rows,
      );
      const allErrors = [...parseResult.errors, ...errors];

      if (stagingAssets.length > 0) {
        await this.prisma.stagingAsset.createMany({ data: stagingAssets });
      }

      await this.prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: PrismaJobStatus.STAGED,
          total_rows: parseResult.rows.length,
          processed_rows: processedCount,
          error_rows: parseResult.rows.length - processedCount,
          errors: allErrors,
          completed_at: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Import job ${jobId} failed:`, error);
      await this.updateJobStatus(jobId, PrismaJobStatus.FAILED, [
        error instanceof Error ? error.message : 'Unknown error',
      ]);
    }
  }

  private mapRowToAsset(row: Record<string, string>): MappedAssetData {
    // Simple mapping - will be enhanced with configurable rules in future phases
    return {
      assetTag: row['Asset ID'] || row['Asset Tag'] || row['ID'] || '',
      name: row['Name'] || row['Asset Name'] || '',
      description: row['Description'],
      buildingName: row['Building'],
      floor: row['Floor'],
      room: row['Room'],
      status: row['Status'] || 'ACTIVE',
      conditionAssessment: row['Condition'] || 'GOOD',
      manufacturer: row['Manufacturer'],
      modelNumber: row['Model'] || row['Model Number'],
      serialNumber: row['Serial Number'] || row['Serial'],
    };
  }

  public async getJobStatus(jobId: string): Promise<JobStatus> {
    const job = await this.prisma.importJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Import job ${jobId} not found`);
    }

    return {
      id: job.id,
      status: job.status,
      progress: job.total_rows
        ? {
            total: job.total_rows,
            processed: job.processed_rows,
          }
        : undefined,
      errors: job.errors as string[],
    };
  }

  public async previewCsvFile(fileId: string): Promise<{
    data: Record<string, string>[];
    columns: string[];
    totalRows: number;
  }> {
    // Parse CSV to get preview - limit to first 100 rows to prevent memory issues
    const parseResult = await this.csvParser.parseFileFromBlob(fileId);

    // Limit preview to first few rows and truncate long values
    const previewData = parseResult.rows
      .slice(0, CONSTANTS.PREVIEW_ROWS_LIMIT)
      .map((row) => {
        const truncatedRow: Record<string, string> = {};
        for (const [key, value] of Object.entries(row)) {
          // Truncate long values to prevent memory issues
          truncatedRow[key] =
            typeof value === 'string' &&
            value.length > CONSTANTS.MAX_PREVIEW_STRING_LENGTH
              ? value.substring(0, CONSTANTS.MAX_PREVIEW_STRING_LENGTH) + '...'
              : value;
        }
        return truncatedRow;
      });

    const columns = previewData.length > 0 ? Object.keys(previewData[0]) : [];

    return {
      data: previewData,
      columns,
      totalRows: parseResult.rows.length,
    };
  }

  public async getStagedData(jobId: string): Promise<{
    data: StagedDataRowResponse[];
    validCount: number;
    invalidCount: number;
  }> {
    const stagingAssets = await this.prisma.stagingAsset.findMany({
      where: { import_job_id: jobId },
      orderBy: { row_number: 'asc' },
      take: 100, // Limit to first 100 rows for preview
    });

    const validCount = await this.prisma.stagingAsset.count({
      where: { import_job_id: jobId, is_valid: true },
    });

    const invalidCount = await this.prisma.stagingAsset.count({
      where: { import_job_id: jobId, is_valid: false },
    });

    return {
      data: stagingAssets.map((asset) => ({
        rowNumber: asset.row_number,
        isValid: asset.is_valid,
        willImport: asset.will_import,
        rawData: asset.raw_data as Record<string, unknown>,
        mappedData: asset.mapped_data as Record<string, unknown>,
        errors: asset.validation_errors as string[] | null,
      })),
      validCount,
      invalidCount,
    };
  }

  public async approveImport(jobId: string): Promise<{
    message: string;
    importedCount: number;
  }> {
    // Get all valid staged assets
    const stagedAssets = await this.prisma.stagingAsset.findMany({
      where: {
        import_job_id: jobId,
        is_valid: true,
        will_import: true,
      },
    });

    if (stagedAssets.length === 0) {
      return {
        message: 'No valid assets to import',
        importedCount: 0,
      };
    }

    // Create assets from staged data
    const assets = stagedAssets.map((staged) => {
      const data = staged.mapped_data as unknown as MappedAssetData;
      return {
        assetTag: data.assetTag || `IMPORT-${staged.row_number}`,
        name: data.name || 'Unnamed Asset',
        description: data.description || null,
        buildingName: data.buildingName || null,
        floor: data.floor || null,
        roomNumber: data.room || null, // Fixed: use roomNumber field
        status: (data.status as AssetStatus) || AssetStatus.ACTIVE,
        condition:
          (data.conditionAssessment as AssetCondition) || AssetCondition.GOOD, // Fixed: use condition field
        manufacturer: data.manufacturer || null,
        modelNumber: data.modelNumber || null,
        serialNumber: data.serialNumber || null,
      };
    });

    // Debug: Log what we're trying to insert
    this.logger.log(
      `[DEBUG] Attempting to insert ${assets.length} assets. Sample tags: ${assets
        .map((a) => a.assetTag)
        .slice(0, 3)
        .join(', ')}`,
    );

    // Bulk insert assets with individual error tracking
    let successCount = 0;
    const errors: string[] = [];

    // Bulk insert assets (no more unique constraint issues)
    try {
      const result = await this.prisma.asset.createMany({
        data: assets,
        // No skipDuplicates needed - duplicate assetTags are now allowed
      });
      successCount = result.count;
      this.logger.log(
        `[DEBUG] Bulk insert successful: ${result.count} assets inserted`,
      );
    } catch (error) {
      // Fallback to individual inserts if bulk fails
      this.logger.warn(
        'Bulk insert failed, falling back to individual inserts',
      );
      for (const asset of assets) {
        try {
          await this.prisma.asset.create({ data: asset });
          successCount++;
        } catch (individualError) {
          const errorMsg = `Failed to insert ${asset.assetTag}: ${individualError instanceof Error ? individualError.message : 'Unknown error'}`;
          errors.push(errorMsg);
          this.logger.error(errorMsg);
        }
      }
    }

    this.logger.log(
      `[DEBUG] Individual insert result: ${successCount} inserted, ${errors.length} failed out of ${assets.length} attempted`,
    );
    if (errors.length > 0) {
      this.logger.error(
        `[DEBUG] Insert errors: ${errors.slice(0, 5).join('; ')}${errors.length > 5 ? ` (and ${errors.length - 5} more)` : ''}`,
      );
    }

    const result = { count: successCount };

    // Update job status to COMPLETED
    await this.prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completed_at: new Date(),
      },
    });

    // TODO: Add metadata tracking - need to add metadata field to ImportJob schema
    this.logger.log(
      `[METADATA] Import completed - Attempted: ${assets.length}, Success: ${successCount}, Failed: ${errors.length}`,
    );

    // Clear staging data after successful import
    await this.prisma.stagingAsset.deleteMany({
      where: { import_job_id: jobId },
    });

    this.logger.log(
      `Approved import job ${jobId}: ${result.count} assets imported`,
    );

    return {
      message: `Successfully imported ${result.count} assets`,
      importedCount: result.count,
    };
  }

  public async rejectImport(jobId: string): Promise<{
    message: string;
    clearedCount: number;
  }> {
    // Clear staging data
    const deleted = await this.prisma.stagingAsset.deleteMany({
      where: { import_job_id: jobId },
    });

    // Update job status to FAILED
    await this.prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        errors: ['Import rejected by user'],
        completed_at: new Date(),
      },
    });

    this.logger.log(
      `Rejected import job ${jobId}: ${deleted.count} staging records cleared`,
    );

    return {
      message: `Import rejected. ${deleted.count} staging records cleared`,
      clearedCount: deleted.count,
    };
  }

  public async cleanupOldJobs(
    olderThanHours: number = CONSTANTS.DEFAULT_CLEANUP_HOURS,
  ): Promise<{
    message: string;
    jobsDeleted: number;
    stagingRecordsDeleted: number;
  }> {
    const cutoffDate = new Date(
      Date.now() - olderThanHours * MILLISECONDS_PER_HOUR,
    );

    // Find old completed/failed jobs
    const oldJobs = await this.prisma.importJob.findMany({
      where: {
        completed_at: {
          lt: cutoffDate,
        },
        status: {
          in: ['COMPLETED', 'FAILED'],
        },
      },
      select: { id: true },
    });

    if (oldJobs.length === 0) {
      return {
        message: 'No old jobs to cleanup',
        jobsDeleted: 0,
        stagingRecordsDeleted: 0,
      };
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

    this.logger.log(
      `Cleanup completed: ${jobsDeleted.count} jobs, ${stagingDeleted.count} staging records`,
    );

    return {
      message: `Cleaned up ${jobsDeleted.count} old jobs and ${stagingDeleted.count} staging records`,
      jobsDeleted: jobsDeleted.count,
      stagingRecordsDeleted: stagingDeleted.count,
    };
  }

  public async clearAllJobs(): Promise<{
    message: string;
    jobsDeleted: number;
    stagingRecordsDeleted: number;
    logsDeleted: number;
  }> {
    // Delete all staging records first (foreign key constraint)
    const stagingDeleted = await this.prisma.stagingAsset.deleteMany({});

    // Delete all import jobs
    const jobsDeleted = await this.prisma.importJob.deleteMany({});

    // Clear all logs too
    const logsDeleted = await this.prisma.logEntry.deleteMany({});

    this.logger.log(
      `Emergency cleanup: ${jobsDeleted.count} jobs, ${stagingDeleted.count} staging records, ${logsDeleted.count} logs`,
    );

    return {
      message: `Cleared ALL data: ${jobsDeleted.count} jobs, ${stagingDeleted.count} staging records, ${logsDeleted.count} logs`,
      jobsDeleted: jobsDeleted.count,
      stagingRecordsDeleted: stagingDeleted.count,
      logsDeleted: logsDeleted.count,
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
    // Parse CSV file
    const parseResult = await this.csvParser.parseFileFromBlob(fileId);

    if (parseResult.errors.length > 0 && parseResult.rows.length === 0) {
      return {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        errors: parseResult.errors,
        sampleValidData: [],
        sampleInvalidData: [],
      };
    }

    const validData: Array<{
      rowNumber: number;
      rawData: Record<string, string>;
      mappedData: Record<string, string>;
    }> = [];
    const invalidData: Array<{
      rowNumber: number;
      rawData: Record<string, string>;
      errors: string[];
    }> = [];
    const allErrors: string[] = [...parseResult.errors];
    let validCount = 0;

    // Process first batch of rows for validation samples
    const sampleSize = Math.min(
      parseResult.rows.length,
      CONSTANTS.VALIDATION_SAMPLE_SIZE,
    );

    for (let i = 0; i < sampleSize; i++) {
      const row = parseResult.rows[i];
      const rowNumber = i + CONSTANTS.HEADER_ROW_OFFSET;

      try {
        const assetData = this.mapRowToAsset(row);
        const validationErrors = this.validateAssetData(assetData);

        const isValid = validationErrors.length === 0;
        if (isValid) {
          validCount++;
          this.addValidSample(validData, {
            rowNumber,
            rawData: row,
            mappedData: assetData,
          });
        } else {
          this.addInvalidSample(invalidData, {
            rowNumber,
            rawData: row,
            errors: validationErrors,
          });
          allErrors.push(`Row ${rowNumber}: ${validationErrors.join(', ')}`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.addInvalidSample(invalidData, {
          rowNumber,
          rawData: row,
          errors: [errorMessage],
        });
        allErrors.push(`Row ${rowNumber}: ${errorMessage}`);
      }
    }

    // Estimate totals for larger files
    const validPercentage = sampleSize > 0 ? validCount / sampleSize : 0;
    const estimatedValidRows = Math.round(
      parseResult.rows.length * validPercentage,
    );
    const estimatedInvalidRows = parseResult.rows.length - estimatedValidRows;

    return {
      totalRows: parseResult.rows.length,
      validRows: estimatedValidRows,
      invalidRows: estimatedInvalidRows,
      errors: allErrors.slice(0, CONSTANTS.MAX_ERROR_DISPLAY),
      sampleValidData: validData,
      sampleInvalidData: invalidData,
    };
  }

  public async testETLRules(): Promise<{
    success: boolean;
    testData: {
      before: any;
      after: any;
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

    // Create test data with whitespace that needs trimming
    const testData = {
      name: '   HVAC Unit 001   \t\n',
      assetTag: 'TEST-001',
      manufacturer: '  TestCorp  ',
      description: '\tTest Description\n',
    };

    const context = {
      rowNumber: 1,
      jobId: 'test-rules-job',
      correlationId: 'test-correlation-' + Date.now(),
      metadata: { source: 'api-test' },
    };

    try {
      // Get all active rules for ALL phases
      const allActiveRules = await this.prisma.pipelineRule.findMany({
        where: { is_active: true },
        orderBy: [{ phase: 'asc' }, { priority: 'asc' }, { name: 'asc' }],
      });

      // If no rules exist, create a demo TRIM rule
      if (allActiveRules.length === 0) {
        this.logger.debug(
          'No active CLEAN rules found, creating demo TRIM rule',
        );
        await this.ruleEngine.createRule({
          name: 'Demo TRIM Rule',
          description: 'Automatically created for testing',
          phase: 'CLEAN',
          type: 'TRIM',
          target: 'name',
          config: {
            sides: 'both',
            customChars: ' \t\n\r',
          },
          priority: 1,
        });
      }

      // Process through all phases like orchestrator
      const phases = ['CLEAN', 'TRANSFORM', 'VALIDATE', 'MAP'] as const;
      let currentData = testData;
      const allRulesApplied: any[] = [];

      for (const phase of phases) {
        const phaseRules = allActiveRules.filter(
          (rule) => rule.phase === phase,
        );
        if (phaseRules.length > 0) {
          const result = await this.ruleEngine.processDataWithRules(
            currentData,
            phase,
            context,
          );
          currentData = result.data;

          // Add applied rules from this phase
          phaseRules.forEach((rule) => {
            allRulesApplied.push({
              name: rule.name,
              type: rule.type,
              phase: rule.phase,
              target: rule.target,
            });
          });
        }
      }

      this.logger.debug(
        `ETL rules test completed. Applied ${allRulesApplied.length} rules`,
      );

      return {
        success: true,
        testData: {
          before: testData,
          after: currentData,
        },
        rulesApplied: allRulesApplied,
        processing: {
          errors: [],
          warnings: [],
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`ETL rules test failed: ${errorMessage}`);

      return {
        success: false,
        testData: {
          before: testData,
          after: testData, // Return original data on failure
        },
        rulesApplied: [],
        processing: {
          errors: [`Test failed: ${errorMessage}`],
          warnings: [],
        },
      };
    }
  }

  public async testPipelineOrchestrator(): Promise<any> {
    this.logger.debug('Testing pipeline orchestrator with all phases');

    try {
      // Create orchestrator and register all phase processors
      const orchestrator = new PipelineOrchestrator(this);

      // Register all phase processors
      orchestrator.registerProcessor(new ExtractPhaseProcessor(this));
      orchestrator.registerProcessor(new ValidatePhaseProcessor());
      orchestrator.registerProcessor(new CleanPhaseProcessor(this.prisma)); // This has the REAL rules engine!
      orchestrator.registerProcessor(new TransformPhaseProcessor());
      orchestrator.registerProcessor(new MapPhaseProcessor());
      orchestrator.registerProcessor(new LoadPhaseProcessor());

      // Run the full orchestration with test data
      const result = await orchestrator.testAllPhases();

      this.logger.debug(
        `Pipeline orchestrator test completed. Success: ${result.success}`,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Pipeline orchestrator test failed: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
        data: null,
      };
    }
  }

  public async getRules(): Promise<
    Array<{
      id: string;
      name: string;
      type: string;
      phase: string;
      target: string;
      config: any;
      is_active: boolean;
      priority: number;
      created_at: Date;
      updated_at: Date;
    }>
  > {
    this.logger.debug('Getting all pipeline rules');
    const rules = await this.prisma.pipelineRule.findMany({
      orderBy: [{ phase: 'asc' }, { priority: 'asc' }, { name: 'asc' }],
    });
    return rules;
  }

  public async createRule(createRuleDto: {
    name: string;
    type: string;
    phase: string;
    target: string;
    config: any;
    is_active?: boolean;
    priority?: number;
  }): Promise<any> {
    this.logger.debug(`Creating pipeline rule: ${createRuleDto.name}`);
    const rule = await this.prisma.pipelineRule.create({
      data: {
        name: createRuleDto.name,
        type: createRuleDto.type as any,
        phase: createRuleDto.phase as any,
        target: createRuleDto.target,
        config: createRuleDto.config,
        is_active: createRuleDto.is_active ?? true,
        priority: createRuleDto.priority ?? 1,
      },
    });
    return rule;
  }

  public async updateRule(
    ruleId: string,
    updateRuleDto: {
      name?: string;
      type?: string;
      phase?: string;
      target?: string;
      config?: any;
      is_active?: boolean;
      priority?: number;
    },
  ): Promise<any> {
    this.logger.debug(`Updating pipeline rule: ${ruleId}`);
    const updateData: any = {};
    if (updateRuleDto.name !== undefined) updateData.name = updateRuleDto.name;
    if (updateRuleDto.type !== undefined)
      updateData.type = updateRuleDto.type as any;
    if (updateRuleDto.phase !== undefined)
      updateData.phase = updateRuleDto.phase as any;
    if (updateRuleDto.target !== undefined)
      updateData.target = updateRuleDto.target;
    if (updateRuleDto.config !== undefined)
      updateData.config = updateRuleDto.config;
    if (updateRuleDto.is_active !== undefined)
      updateData.is_active = updateRuleDto.is_active;
    if (updateRuleDto.priority !== undefined)
      updateData.priority = updateRuleDto.priority;

    const rule = await this.prisma.pipelineRule.update({
      where: { id: ruleId },
      data: updateData,
    });
    return rule;
  }

  public async deleteRule(ruleId: string): Promise<void> {
    this.logger.debug(`Deleting pipeline rule: ${ruleId}`);
    await this.prisma.pipelineRule.delete({
      where: { id: ruleId },
    });
  }

  public async listJobs(): Promise<Array<{
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
  }>> {
    this.logger.debug('Getting recent import jobs');
    const jobs = await this.prisma.importJob.findMany({
      orderBy: { started_at: 'desc' },
      take: 50, // Limit to recent 50 jobs
    });
    
    // Map Prisma response to expected interface
    return jobs.map(job => ({
      id: job.id,
      file_id: job.file_id,
      status: job.status.toString(),
      total_rows: job.total_rows,
      processed_rows: job.processed_rows,
      error_rows: job.error_rows,
      errors: Array.isArray(job.errors) ? job.errors as string[] : null,
      started_at: job.started_at,
      completed_at: job.completed_at,
      created_by: job.created_by,
    }));
  }
}
