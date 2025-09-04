import { Controller, Get, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PipelineService } from './pipeline.service';

@ApiTags('pipeline')
@Controller('api/pipeline')
export class PipelineController {
  public constructor(private readonly pipelineService: PipelineService) {}

  @Get('files')
  @ApiOperation({ summary: 'List CSV files available for import' })
  @ApiResponse({ status: 200, description: 'Files retrieved successfully' })
  public async listFiles(): Promise<{
    files: Array<{ id: string; name: string; size: number; created_at: Date }>;
  }> {
    const files = await this.pipelineService.listCsvFiles();
    return { files };
  }

  @Post('import/:fileId')
  @ApiOperation({ summary: 'Start import process for a file' })
  @ApiResponse({ status: 201, description: 'Import job started' })
  public async startImport(
    @Param('fileId') fileId: string,
  ): Promise<{ jobId: string; message: string }> {
    const jobId = await this.pipelineService.startImport(fileId);
    return { jobId, message: 'Import started successfully' };
  }

  @Get('status/:jobId')
  @ApiOperation({ summary: 'Check import job status' })
  @ApiResponse({ status: 200, description: 'Job status retrieved' })
  public async getStatus(@Param('jobId') jobId: string): Promise<{
    id: string;
    status: string;
    progress?: { total: number; processed: number };
    errors?: string[];
  }> {
    const status = await this.pipelineService.getJobStatus(jobId);
    return status;
  }

  @Get('preview/:fileId')
  @ApiOperation({ summary: 'Preview raw CSV data before import' })
  @ApiResponse({ status: 200, description: 'Raw CSV preview retrieved' })
  public async previewFile(@Param('fileId') fileId: string): Promise<{
    data: Record<string, string>[];
    columns: string[];
    totalRows: number;
  }> {
    const preview = await this.pipelineService.previewCsvFile(fileId);
    return preview;
  }

  @Get('staging/:jobId')
  @ApiOperation({ summary: 'Get staged data for preview' })
  @ApiResponse({ status: 200, description: 'Staged data retrieved' })
  public async getStagedData(@Param('jobId') jobId: string): Promise<{
    data: Array<{
      rowNumber: number;
      isValid: boolean;
      willImport: boolean;
      rawData: Record<string, unknown>;
      mappedData: Record<string, unknown>;
      errors: string[] | null;
    }>;
    validCount: number;
    invalidCount: number;
  }> {
    const stagedData = await this.pipelineService.getStagedData(jobId);
    return stagedData;
  }

  @Post('approve/:jobId')
  @ApiOperation({ summary: 'Approve and import staged data to assets table' })
  @ApiResponse({ status: 200, description: 'Import approved and completed' })
  public async approveImport(@Param('jobId') jobId: string): Promise<{
    message: string;
    importedCount: number;
  }> {
    const result = await this.pipelineService.approveImport(jobId);
    return result;
  }

  @Post('reject/:jobId')
  @ApiOperation({ summary: 'Reject and clear staged data' })
  @ApiResponse({ status: 200, description: 'Staged data cleared' })
  public async rejectImport(@Param('jobId') jobId: string): Promise<{
    message: string;
    clearedCount: number;
  }> {
    const result = await this.pipelineService.rejectImport(jobId);
    return result;
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Cleanup old completed/failed import jobs' })
  @ApiResponse({ status: 200, description: 'Old jobs cleaned up' })
  public async cleanupOldJobs(): Promise<{
    message: string;
    jobsDeleted: number;
    stagingRecordsDeleted: number;
  }> {
    const result = await this.pipelineService.cleanupOldJobs();
    return result;
  }

  @Post('cleanup/all')
  @ApiOperation({
    summary: 'Clear ALL import jobs and staging data (emergency cleanup)',
  })
  @ApiResponse({ status: 200, description: 'All jobs cleared' })
  public async clearAllJobs(): Promise<{
    message: string;
    jobsDeleted: number;
    stagingRecordsDeleted: number;
    logsDeleted: number;
  }> {
    const result = await this.pipelineService.clearAllJobs();
    return result;
  }

  @Post('validate/:fileId')
  @ApiOperation({
    summary: 'Validate CSV data without importing (development)',
  })
  @ApiResponse({ status: 200, description: 'Validation results returned' })
  public async validateCsvFile(@Param('fileId') fileId: string): Promise<{
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
    const result = await this.pipelineService.validateCsvFile(fileId);
    return result;
  }
}
