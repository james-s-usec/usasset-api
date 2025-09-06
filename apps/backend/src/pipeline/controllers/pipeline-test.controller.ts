import { Controller, Post, Param, Body, Logger } from '@nestjs/common';
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

@ApiTags('pipeline-testing')
@Controller('api/pipeline')
export class PipelineTestController {
  private readonly logger = new Logger(PipelineTestController.name);

  public constructor(private readonly pipelineService: PipelineService) {}

  @Post('validate/:fileId')
  @ApiOperation({ summary: 'Validate file data without importing' })
  @ApiResponse({
    status: 200,
    description: 'Validation completed successfully',
  })
  public async validateFile(
    @Param('fileId') fileId: string,
  ): Promise<ApiResponse> {
    try {
      const validation = await this.pipelineService.validateCsvFile(fileId);
      return ResponseMapper.success({ validation });
    } catch (error) {
      this.logger.error(`Failed to validate file ${fileId}:`, error);
      return ResponseMapper.error(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

  @Post('test-rules')
  @ApiOperation({ summary: 'Test rules against sample data' })
  @ApiResponse({
    status: 200,
    description: 'Rules test completed successfully',
  })
  public async testRules(): Promise<ApiResponse> {
    try {
      const result = await this.pipelineService.testETLRules();
      return ResponseMapper.success(result);
    } catch (error) {
      this.logger.error('Failed to test rules:', error);
      return ResponseMapper.error(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

  @Post('test-orchestrator')
  @ApiOperation({ summary: 'Test orchestrator with sample file' })
  @ApiResponse({
    status: 200,
    description: 'Orchestrator test completed successfully',
  })
  public testOrchestrator(): ApiResponse {
    try {
      // TODO: Implement testOrchestrator in service
      const result = { message: 'Orchestrator test not yet implemented' };
      return ResponseMapper.success(result);
    } catch (error) {
      this.logger.error('Failed to test orchestrator:', error);
      return ResponseMapper.error(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }
}
