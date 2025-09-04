import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AzureBlobStorageService } from '../files/services/azure-blob-storage.service';
import { CsvParserService } from './services/csv-parser.service';
import { PrismaService } from '../database/prisma.service';
import { ImportJob, JobStatus as PrismaJobStatus } from '@prisma/client';

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

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  public constructor(
    private readonly blobStorageService: AzureBlobStorageService,
    private readonly csvParser: CsvParserService,
    private readonly prisma: PrismaService,
  ) {}

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

  private async processImport(jobId: string, fileId: string): Promise<void> {
    try {
      // Update job status to running
      await this.prisma.importJob.update({
        where: { id: jobId },
        data: { status: 'RUNNING' },
      });

      // Parse the CSV
      const parseResult = await this.csvParser.parseFileFromBlob(fileId);

      if (parseResult.errors.length > 0 && parseResult.rows.length === 0) {
        // Complete failure
        await this.prisma.importJob.update({
          where: { id: jobId },
          data: {
            status: 'FAILED',
            errors: parseResult.errors,
            completed_at: new Date(),
          },
        });
        return;
      }

      // Process rows into staging table
      let processedCount = 0;
      const errors: string[] = [...parseResult.errors];
      const stagingAssets = [];

      for (let i = 0; i < parseResult.rows.length; i++) {
        const row = parseResult.rows[i];
        try {
          // Basic field mapping - will be configurable in future phases
          const assetData = this.mapRowToAsset(row);

          // Validate required fields
          const validationErrors = [];
          if (!assetData.assetTag) {
            validationErrors.push('Missing required field: Asset Tag');
          }
          if (!assetData.name) {
            validationErrors.push('Missing required field: Name');
          }

          const isValid = validationErrors.length === 0;

          // Create staging record
          stagingAssets.push({
            import_job_id: jobId,
            row_number: i + 2, // +2 because row 1 is headers, arrays are 0-indexed
            raw_data: row,
            mapped_data: assetData,
            validation_errors:
              validationErrors.length > 0 ? validationErrors : undefined,
            is_valid: isValid,
            will_import: isValid, // Default to true if valid
          });

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

      // Bulk insert to staging table
      if (stagingAssets.length > 0) {
        await this.prisma.stagingAsset.createMany({
          data: stagingAssets,
        });
      }

      // Update job with STAGED status for review
      await this.prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: 'STAGED',
          total_rows: parseResult.rows.length,
          processed_rows: processedCount,
          error_rows: parseResult.rows.length - processedCount,
          errors: errors,
          completed_at: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Import job ${jobId} failed:`, error);
      await this.prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          completed_at: new Date(),
        },
      });
    }
  }

  private mapRowToAsset(row: Record<string, string>): any {
    // Simple mapping - will be enhanced with configurable rules in future phases
    return {
      assetTag: row['Asset ID'] || row['Asset Tag'] || row['ID'],
      name: row['Name'] || row['Asset Name'],
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

  public async getStagedData(jobId: string): Promise<{
    data: any[];
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
        rawData: asset.raw_data,
        mappedData: asset.mapped_data,
        errors: asset.validation_errors,
      })),
      validCount,
      invalidCount,
    };
  }
}
