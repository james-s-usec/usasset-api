import { Injectable, Logger } from '@nestjs/common';
import { PipelineRepository } from '../repositories/pipeline.repository';
import { AssetStatus, AssetCondition, Prisma } from '@prisma/client';
import { ImportJobResult } from '../interfaces/pipeline-types';
import { CsvParserService } from './csv-parser.service';

const CONSTANTS = {
  PREVIEW_LIMIT: 10,
  VALIDATION_SAMPLE_SIZE: 100,
  MAX_STRING_LENGTH: 200,
  MIN_ARRAY_LENGTH: 2,
};

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

/**
 * Pipeline Import Service
 * Handles business logic for importing CSV data to assets
 * Following Rule #1: Services only contain business rules - no data access
 */
@Injectable()
export class PipelineImportService {
  private readonly logger = new Logger(PipelineImportService.name);

  public constructor(
    private readonly pipelineRepository: PipelineRepository,
    private readonly csvParser: CsvParserService,
  ) {}

  /**
   * Process import job: parse CSV, validate, create staging records
   */
  public async processImport(jobId: string, fileId: string): Promise<void> {
    try {
      // Update job to running status
      await this.pipelineRepository.updateImportJob(jobId, {
        status: 'RUNNING',
      });

      // Parse the CSV file
      const parseResult = await this.csvParser.parseFileFromBlob(fileId);

      if (parseResult.errors.length > 0 && parseResult.rows.length === 0) {
        await this.pipelineRepository.updateImportJob(jobId, {
          status: 'FAILED',
          errors: parseResult.errors,
          completed_at: new Date(),
        });
        return;
      }

      // Process and validate rows
      const { stagingAssets, errors, processedCount } = this.processCsvRows(
        jobId,
        parseResult.rows,
      );
      const allErrors = [...parseResult.errors, ...errors];

      // Create staging records
      if (stagingAssets.length > 0) {
        await this.pipelineRepository.createStagingAssets(stagingAssets);
      }

      // Update job with results
      await this.pipelineRepository.updateImportJob(jobId, {
        status: 'STAGED',
        total_rows: parseResult.rows.length,
        processed_rows: processedCount,
        error_rows: parseResult.rows.length - processedCount,
        errors: allErrors,
        completed_at: new Date(),
      });

      this.logger.log(
        `Import job ${jobId} processed: ${processedCount} valid rows staged`,
      );
    } catch (error) {
      this.logger.error(`Import job ${jobId} failed:`, error);
      await this.pipelineRepository.updateImportJob(jobId, {
        status: 'FAILED',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        completed_at: new Date(),
      });
    }
  }

  /**
   * Approve and import staged data to assets table
   */
  public async approveImport(jobId: string): Promise<ImportJobResult> {
    this.logger.debug(`Approving import for job: ${jobId}`);

    // Get all staged assets and filter for valid ones
    const allStagedAssets =
      await this.pipelineRepository.findStagingAssets(jobId);
    const stagedAssets = allStagedAssets.filter(
      (asset) => asset.is_valid && asset.will_import,
    );

    if (stagedAssets.length === 0) {
      return {
        jobId,
        status: 'completed',
        stats: { total: 0, successful: 0, failed: 0, skipped: 0 },
        errors: ['No valid assets to import'],
      };
    }

    // Convert staged data to asset records
    const assets = stagedAssets.map((staged) => {
      const data = staged.mapped_data as unknown as MappedAssetData;
      return {
        assetTag: data.assetTag || `IMPORT-${staged.row_number}`,
        name: data.name || 'Unnamed Asset',
        description: data.description || null,
        buildingName: data.buildingName || null,
        floor: data.floor || null,
        roomNumber: data.room || null,
        status: (data.status as AssetStatus) || AssetStatus.ACTIVE,
        condition:
          (data.conditionAssessment as AssetCondition) || AssetCondition.GOOD,
        manufacturer: data.manufacturer || null,
        modelNumber: data.modelNumber || null,
        serialNumber: data.serialNumber || null,
      };
    });

    let successCount = 0;
    const errors: string[] = [];

    // Try bulk insert first
    try {
      const result = await this.pipelineRepository.createAssets(assets);
      successCount = result.count;
      this.logger.log(`Bulk insert successful: ${successCount} assets created`);
    } catch {
      // Fallback to individual inserts
      this.logger.warn(
        'Bulk insert failed, falling back to individual inserts',
      );
      const prisma = this.pipelineRepository.getPrismaClient();
      for (const asset of assets) {
        try {
          await prisma.asset.create({ data: asset });
          successCount++;
        } catch (individualError) {
          const errorMsg = `Failed to insert ${asset.assetTag}: ${individualError instanceof Error ? individualError.message : 'Unknown error'}`;
          errors.push(errorMsg);
          this.logger.error(errorMsg);
        }
      }
    }

    // Update job status to completed
    await this.pipelineRepository.updateImportJob(jobId, {
      status: 'COMPLETED',
      completed_at: new Date(),
    });

    // Clear staging data after successful import
    await this.pipelineRepository.deleteStagingAssetsByJob(jobId);

    this.logger.log(
      `Import approved for job ${jobId}: ${successCount} assets imported`,
    );

    return {
      jobId,
      status: 'completed',
      stats: {
        total: assets.length,
        successful: successCount,
        failed: assets.length - successCount,
        skipped: 0,
      },
      errors,
    };
  }

  /**
   * Reject and clear staged data
   */
  public async rejectImport(jobId: string): Promise<{ clearedCount: number }> {
    this.logger.debug(`Rejecting import for job: ${jobId}`);

    // Clear staging data
    const result =
      await this.pipelineRepository.deleteStagingAssetsByJob(jobId);
    const clearedCount = result.count;

    // Update job status to failed
    await this.pipelineRepository.updateImportJob(jobId, {
      status: 'FAILED',
      errors: ['Import rejected by user'],
      completed_at: new Date(),
    });

    this.logger.log(
      `Import rejected for job ${jobId}: ${clearedCount} staging records cleared`,
    );

    return { clearedCount };
  }

  /**
   * Preview CSV file without processing
   */
  public async previewCsvFile(fileId: string): Promise<{
    data: Record<string, string>[];
    columns: string[];
    totalRows: number;
  }> {
    const parseResult = await this.csvParser.parseFileFromBlob(fileId);

    // Limit preview to first 10 rows and truncate long values
    const previewData = parseResult.rows
      .slice(0, CONSTANTS.PREVIEW_LIMIT)
      .map((row) => {
        const truncatedRow: Record<string, string> = {};
        for (const [key, value] of Object.entries(row)) {
          truncatedRow[key] =
            typeof value === 'string' &&
            value.length > CONSTANTS.VALIDATION_SAMPLE_SIZE
              ? value.substring(0, CONSTANTS.VALIDATION_SAMPLE_SIZE) + '...'
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

  /**
   * Process CSV rows into staging records
   */
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

        const isValid = validationErrors.length === 0;

        // Truncate large raw data values
        const truncatedRow: Record<string, string> = {};
        for (const [key, value] of Object.entries(row)) {
          truncatedRow[key] =
            typeof value === 'string' &&
            value.length > CONSTANTS.MAX_STRING_LENGTH
              ? value.substring(0, CONSTANTS.MAX_STRING_LENGTH) + '...'
              : value;
        }

        const stagingRecord: Prisma.StagingAssetCreateManyInput = {
          import_job_id: jobId,
          row_number: i + 2, // Account for header row
          raw_data: truncatedRow as Prisma.InputJsonValue,
          mapped_data: assetData as unknown as Prisma.InputJsonValue,
          validation_errors:
            validationErrors.length > 0
              ? (validationErrors as Prisma.InputJsonValue)
              : undefined,
          is_valid: isValid,
          will_import: isValid,
        };

        stagingAssets.push(stagingRecord);

        if (isValid) {
          processedCount++;
        } else {
          errors.push(`Row ${i + 2}: ${validationErrors.join(', ')}`);
        }
      } catch (error) {
        errors.push(
          `Row ${i + 2}: Failed to process - ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return { stagingAssets, errors, processedCount };
  }

  /**
   * Map CSV row to asset data
   */
  private mapRowToAsset(row: Record<string, string>): MappedAssetData {
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

  /**
   * Validate mapped asset data
   */
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
}
