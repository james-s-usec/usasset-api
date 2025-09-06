import { Controller, Get, Param, Logger } from '@nestjs/common';
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

@ApiTags('pipeline-jobs')
@Controller('api/pipeline')
export class PipelineJobController {
  private readonly logger = new Logger(PipelineJobController.name);

  public constructor(private readonly pipelineService: PipelineService) {}

  @Get('jobs')
  @ApiOperation({ summary: 'Get all pipeline jobs with status' })
  @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
  public async getJobs(): Promise<ApiResponse> {
    try {
      // Note: Need to implement getAllJobs in service
      const jobs = await this.pipelineService.listCsvFiles();
      return ResponseMapper.success({ jobs });
    } catch (error) {
      this.logger.error('Failed to get jobs:', error);
      return ResponseMapper.error(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

  @Get('status/:jobId')
  @ApiOperation({ summary: 'Get job status and progress' })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved successfully',
  })
  public async getJobStatus(
    @Param('jobId') jobId: string,
  ): Promise<ApiResponse> {
    try {
      const status = await this.pipelineService.getJobStatus(jobId);
      return ResponseMapper.success({ status });
    } catch (error) {
      this.logger.error(`Failed to get job status for ${jobId}:`, error);
      return ResponseMapper.error(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

  @Get('preview/:fileId')
  @ApiOperation({ summary: 'Preview CSV file data' })
  @ApiResponse({
    status: 200,
    description: 'Preview data retrieved successfully',
  })
  public async previewCsv(
    @Param('fileId') fileId: string,
  ): Promise<ApiResponse> {
    try {
      const preview = await this.pipelineService.previewCsvFile(fileId);
      return ResponseMapper.success(preview);
    } catch (error) {
      this.logger.error(`Failed to preview file ${fileId}:`, error);
      return ResponseMapper.error(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

  @Get('staging/:jobId')
  @ApiOperation({ summary: 'Get staged data for job' })
  @ApiResponse({
    status: 200,
    description: 'Staged data retrieved successfully',
  })
  public async getStagingData(
    @Param('jobId') jobId: string,
  ): Promise<ApiResponse> {
    try {
      const stagingData = await this.pipelineService.getStagedData(jobId);
      return ResponseMapper.success({ stagingData });
    } catch (error) {
      this.logger.error(`Failed to get staging data for job ${jobId}:`, error);
      return ResponseMapper.error(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

  @Get('jobs/:jobId/phase-results')
  @ApiOperation({ summary: 'Get phase results for job' })
  @ApiResponse({
    status: 200,
    description: 'Phase results retrieved successfully',
  })
  public async getPhaseResults(
    @Param('jobId') jobId: string,
  ): Promise<ApiResponse> {
    try {
      const phaseResults = await this.pipelineService.getPhaseResults(jobId);
      return ResponseMapper.success({ phaseResults });
    } catch (error) {
      this.logger.error(`Failed to get phase results for job ${jobId}:`, error);
      return ResponseMapper.error(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

  @Get('jobs/:jobId/phase-results/download')
  @ApiOperation({ summary: 'Download phase results for job' })
  @ApiResponse({ status: 200, description: 'Phase results download initiated' })
  public downloadPhaseResults(@Param('jobId') jobId: string): ApiResponse {
    try {
      // TODO: Implement downloadPhaseResults in service
      return ResponseMapper.success({
        message: 'Download functionality not yet implemented',
        jobId,
      });
    } catch (error) {
      this.logger.error(
        `Failed to download phase results for job ${jobId}:`,
        error,
      );
      return ResponseMapper.error(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }
}
