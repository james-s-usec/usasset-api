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
  public async listFiles(): Promise<{ files: Array<{ id: string; name: string; size: number; created_at: Date }> }> {
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
  public async getStatus(): Promise<{
    status: string;
    progress?: { total: number; processed: number };
  }> {
    // jobId parameter will be added back in later phases for actual job lookup
    const status = await this.pipelineService.getJobStatus();
    return status;
  }
}
