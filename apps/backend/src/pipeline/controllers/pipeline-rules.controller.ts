import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PipelineService } from '../pipeline.service';
import { ResponseMapper } from '../../common/utils/response-mapper.util';
import { CreateRuleDto, UpdateRuleDto } from '../dto/pipeline-dto';

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

@ApiTags('pipeline-rules')
@Controller('api/pipeline/rules')
export class PipelineRulesController {
  private readonly logger = new Logger(PipelineRulesController.name);

  public constructor(private readonly pipelineService: PipelineService) {}

  @Get()
  @ApiOperation({ summary: 'Get all pipeline rules' })
  @ApiResponse({ status: 200, description: 'Rules retrieved successfully' })
  public async getRules(): Promise<ApiResponse> {
    try {
      const rules = await this.pipelineService.getRules();
      return ResponseMapper.success({ rules });
    } catch (error) {
      this.logger.error('Failed to get rules:', error);
      return ResponseMapper.error(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create new pipeline rule' })
  @ApiResponse({ status: 201, description: 'Rule created successfully' })
  public async createRule(
    @Body() ruleData: CreateRuleDto,
  ): Promise<ApiResponse> {
    try {
      const rule = await this.pipelineService.createRule(ruleData);
      return ResponseMapper.success({ rule });
    } catch (error) {
      this.logger.error('Failed to create rule:', error);
      return ResponseMapper.error(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

  @Patch(':ruleId')
  @ApiOperation({ summary: 'Update pipeline rule' })
  @ApiResponse({ status: 200, description: 'Rule updated successfully' })
  public async updateRule(
    @Param('ruleId') ruleId: string,
    @Body() updates: UpdateRuleDto,
  ): Promise<ApiResponse> {
    try {
      const rule = await this.pipelineService.updateRule(ruleId, updates);
      return ResponseMapper.success({ rule });
    } catch (error) {
      this.logger.error(`Failed to update rule ${ruleId}:`, error);
      return ResponseMapper.error(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

  @Delete(':ruleId')
  @ApiOperation({ summary: 'Delete pipeline rule' })
  @ApiResponse({ status: 200, description: 'Rule deleted successfully' })
  public async deleteRule(
    @Param('ruleId') ruleId: string,
  ): Promise<ApiResponse> {
    try {
      await this.pipelineService.deleteRule(ruleId);
      return ResponseMapper.success({ message: 'Rule deleted successfully' });
    } catch (error) {
      this.logger.error(`Failed to delete rule ${ruleId}:`, error);
      return ResponseMapper.error(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }
}
