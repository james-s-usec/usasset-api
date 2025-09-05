import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PipelineService } from './pipeline.service';

@ApiTags('pipeline')
// CODE_SMELL: [Rule #4] COMPLEXITY - Controller has 18 endpoints, violates complexity budget
// TODO: Split into PipelineImportController, PipelineRulesController, PipelineJobsController
@Controller('api/pipeline')
export class PipelineController {
  public constructor(private readonly pipelineService: PipelineService) {}

  @Get('files')
  @ApiOperation({ summary: 'List CSV files available for import' })
  @ApiResponse({ status: 200, description: 'Files retrieved successfully' })
  // CODE_SMELL: [Rule #1] ARCHITECTURE - Controller defines response types inline
  // TODO: Create FileListResponse interface in dto/
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
  // CODE_SMELL: [Rule #1] ARCHITECTURE - Complex inline response type should be in DTO
  // TODO: Create StagedDataResponse interface
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

  @Get('jobs')
  @ApiOperation({ summary: 'List recent import jobs' })
  @ApiResponse({ status: 200, description: 'Jobs retrieved successfully' })
  public async listJobs(): Promise<{
    jobs: Array<{
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
    }>;
  }> {
    const jobs = await this.pipelineService.listJobs();
    return { jobs };
  }

  @Post('validate/:fileId')
  @ApiOperation({
    summary: 'Validate CSV data without importing (development)',
  })
  @ApiResponse({ status: 200, description: 'Validation results returned' })
  // CODE_SMELL: [Rule #1] ARCHITECTURE - Complex nested response type should be extracted
  // TODO: Create ValidationResultResponse and ValidationSampleData DTOs
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

  @Post('test-rules')
  @ApiOperation({ summary: 'Test ETL rules with sample data (development)' })
  @ApiResponse({
    status: 200,
    description: 'Rule test results with before/after data',
  })
  public async testRules(): Promise<{
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
    const result = await this.pipelineService.testETLRules();
    return result;
  }

  @Post('test-orchestrator')
  @ApiOperation({
    summary: 'Test pipeline orchestrator with all phases (development)',
  })
  @ApiResponse({
    status: 200,
    description: 'Full orchestration results with phase-by-phase breakdown',
  })
  public async testOrchestrator(): Promise<Record<string, unknown>> {
    const result = this.pipelineService.testPipelineOrchestrator();
    return result;
  }

  @Get('rules')
  @ApiOperation({ summary: 'Get all pipeline rules' })
  @ApiResponse({
    status: 200,
    description: 'Pipeline rules retrieved successfully',
  })
  public async getRules(): Promise<{
    rules: Array<{
      id: string;
      name: string;
      type: string;
      phase: string;
      target: string;
      config: Record<string, unknown>;
      is_active: boolean;
      priority: number;
      created_at: Date;
      updated_at: Date;
    }>;
  }> {
    const rules = await this.pipelineService.getRules();
    return {
      rules: rules.map((rule) => this.mapRuleToResponse(rule)),
    };
  }

  private mapRuleToResponse(rule: unknown): {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
  } {
    const ruleObj = rule as Record<string, unknown>;
    return {
      id: ruleObj.id as string,
      name: ruleObj.name as string,
      type: ruleObj.type as string,
      phase: ruleObj.phase as string,
      target: ruleObj.target as string,
      config: ruleObj.config as Record<string, unknown>,
      is_active: ruleObj.is_active as boolean,
      priority: ruleObj.priority as number,
      created_at: ruleObj.created_at as Date,
      updated_at: ruleObj.updated_at as Date,
    };
  }

  @Post('rules')
  @ApiOperation({ summary: 'Create a new pipeline rule' })
  @ApiResponse({ status: 201, description: 'Rule created successfully' })
  public async createRule(
    @Body()
    createRuleDto: {
      name: string;
      type: string;
      phase: string;
      target: string;
      config: Record<string, unknown>;
      is_active?: boolean;
      priority?: number;
    },
  ): Promise<{ rule: Record<string, unknown>; message: string }> {
    const properDto = this.buildCreateRuleDto(createRuleDto);
    const rule = await this.pipelineService.createRule(properDto);
    return {
      rule: rule as Record<string, unknown>,
      message: 'Rule created successfully',
    };
  }

  private buildCreateRuleDto(createRuleDto: {
    name: string;
    type: string;
    phase: string;
    target: string;
    config: Record<string, unknown>;
    is_active?: boolean;
    priority?: number;
  }) {
    return {
      name: createRuleDto.name,
      type: createRuleDto.type,
      phase: createRuleDto.phase,
      target: createRuleDto.target,
      config: createRuleDto.config as {
        [key: string]: string | number | boolean | string[];
      },
      is_active: createRuleDto.is_active,
      priority: createRuleDto.priority,
    };
  }

  @Patch('rules/:ruleId')
  @ApiOperation({ summary: 'Update an existing pipeline rule' })
  @ApiResponse({ status: 200, description: 'Rule updated successfully' })
  public async updateRule(
    @Param('ruleId') ruleId: string,
    @Body()
    updateRuleDto: {
      name?: string;
      type?: string;
      phase?: string;
      target?: string;
      config?: Record<string, unknown>;
      is_active?: boolean;
      priority?: number;
    },
  ): Promise<{ rule: Record<string, unknown>; message: string }> {
    const properDto = this.buildUpdateRuleDto(updateRuleDto);
    const rule = await this.pipelineService.updateRule(ruleId, properDto);
    return {
      rule: rule as Record<string, unknown>,
      message: 'Rule updated successfully',
    };
  }

  private buildUpdateRuleDto(updateRuleDto: {
    name?: string;
    type?: string;
    phase?: string;
    target?: string;
    config?: Record<string, unknown>;
    is_active?: boolean;
    priority?: number;
  }) {
    return {
      name: updateRuleDto.name,
      type: updateRuleDto.type,
      phase: updateRuleDto.phase,
      target: updateRuleDto.target,
      config: updateRuleDto.config as
        | { [key: string]: string | number | boolean | string[] }
        | undefined,
      is_active: updateRuleDto.is_active,
      priority: updateRuleDto.priority,
    };
  }

  @Delete('rules/:ruleId')
  @ApiOperation({ summary: 'Delete a pipeline rule' })
  @ApiResponse({ status: 200, description: 'Rule deleted successfully' })
  public async deleteRule(@Param('ruleId') ruleId: string): Promise<{
    message: string;
  }> {
    await this.pipelineService.deleteRule(ruleId);
    return { message: 'Rule deleted successfully' };
  }
}
