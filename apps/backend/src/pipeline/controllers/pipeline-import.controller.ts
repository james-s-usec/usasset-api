import { Controller, Get, Post, Param, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PipelineService } from '../pipeline.service';
import { ResponseMapper } from '../../common/utils/response-mapper.util';

type ApiResponse =
  | {
      success: true;
      data: unknown;
      timestamp: string;
      correlationId?: string;
    }
  | {
      success: false;
      error: string;
      timestamp: string;
      correlationId?: string;
      details?: unknown;
    };

@ApiTags('pipeline-import')
@Controller('api/pipeline')
export class PipelineImportController {
  private readonly logger = new Logger(PipelineImportController.name);

  public constructor(private readonly pipelineService: PipelineService) {}

  @Get('files')
  @ApiOperation({ summary: 'Get all CSV files available for import' })
  @ApiResponse({ status: 200, description: 'Files retrieved successfully' })
  public async getCsvFiles(): Promise<ApiResponse> {
    try {
      const files = await this.pipelineService.listCsvFiles();
      return ResponseMapper.success({ files });
    } catch (error) {
      this.logger.error('Failed to get CSV files:', error);
      return ResponseMapper.error(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

  @Post('import/:fileId')
  @ApiOperation({ summary: 'Start pipeline import job' })
  @ApiResponse({ status: 200, description: 'Import job started successfully' })
  public async startImport(
    @Param('fileId') fileId: string,
  ): Promise<ApiResponse> {
    try {
      const jobId = await this.pipelineService.startImport(fileId);
      return ResponseMapper.success({
        jobId,
        message: 'Import started successfully',
      });
    } catch (error) {
      this.logger.error(`Failed to start import for file ${fileId}:`, error);
      return ResponseMapper.error(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

  @Post('approve/:jobId')
  @ApiOperation({ summary: 'Approve staged data for final import' })
  @ApiResponse({ status: 200, description: 'Data approved successfully' })
  public async approveImport(
    @Param('jobId') jobId: string,
  ): Promise<ApiResponse> {
    try {
      const result = await this.pipelineService.approveImport(jobId);
      return ResponseMapper.success(result);
    } catch (error) {
      this.logger.error(`Failed to approve import job ${jobId}:`, error);
      return ResponseMapper.error(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

  @Post('reject/:jobId')
  @ApiOperation({ summary: 'Reject staged data' })
  @ApiResponse({ status: 200, description: 'Data rejected successfully' })
  public async rejectImport(
    @Param('jobId') jobId: string,
  ): Promise<ApiResponse> {
    try {
      const result = await this.pipelineService.rejectImport(jobId);
      return ResponseMapper.success(result);
    } catch (error) {
      this.logger.error(`Failed to reject import job ${jobId}:`, error);
      return ResponseMapper.error(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

  @Get('field-mappings/:fileId')
  @ApiOperation({ summary: 'Get field mappings for file' })
  @ApiResponse({
    status: 200,
    description: 'Field mappings retrieved successfully',
  })
  public async getFieldMappings(
    @Param('fileId') fileId: string,
  ): Promise<ApiResponse> {
    try {
      const mappings = await this.pipelineService.getFieldMappings(fileId);
      return ResponseMapper.success({ mappings });
    } catch (error) {
      this.logger.error(
        `Failed to get field mappings for file ${fileId}:`,
        error,
      );
      return ResponseMapper.error(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Cleanup failed jobs' })
  @ApiResponse({ status: 200, description: 'Cleanup completed successfully' })
  public async cleanup(): Promise<ApiResponse> {
    try {
      const result = await this.pipelineService.cleanupOldJobs();
      return ResponseMapper.success(result);
    } catch (error) {
      this.logger.error('Failed to cleanup jobs:', error);
      return ResponseMapper.error(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

  @Post('cleanup/all')
  @ApiOperation({ summary: 'Cleanup all jobs and data' })
  @ApiResponse({
    status: 200,
    description: 'Full cleanup completed successfully',
  })
  public async cleanupAll(): Promise<ApiResponse> {
    try {
      const result = await this.pipelineService.clearAllJobs();
      return ResponseMapper.success(result);
    } catch (error) {
      this.logger.error('Failed to cleanup all:', error);
      return ResponseMapper.error(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }
}
