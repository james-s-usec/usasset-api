import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PipelineService } from './pipeline.service';
import { UpdateRuleDto } from './dto/pipeline-dto';
import { GetPhaseResultsResponseDto } from './dto/phase-results.dto';

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

  @Get('field-mappings/:fileId')
  @ApiOperation({ summary: 'Get field mappings for CSV import using aliases' })
  @ApiResponse({
    status: 200,
    description: 'Field mappings retrieved with confidence scores',
  })
  public async getFieldMappings(@Param('fileId') fileId: string): Promise<{
    mappedFields: Array<{
      csvHeader: string;
      assetField: string;
      confidence: number;
    }>;
    unmappedFields: string[];
    totalCsvColumns: number;
    mappedCount: number;
  }> {
    return await this.pipelineService.getFieldMappings(fileId);
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
  public testOrchestrator(): Record<string, unknown> {
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
    type: string;
    phase: string;
    target: string;
    config: Record<string, unknown>;
    is_active: boolean;
    priority: number;
    created_at: Date;
    updated_at: Date;
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
  }): {
    name: string;
    type: string;
    phase: string;
    target: string;
    config: { [key: string]: string | number | boolean | string[] };
    is_active?: boolean;
    priority?: number;
  } {
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
    @Body() updateRuleDto: UpdateRuleDto,
  ): Promise<{ rule: Record<string, unknown>; message: string }> {
    const rule = await this.pipelineService.updateRule(ruleId, updateRuleDto);
    return {
      rule: rule as Record<string, unknown>,
      message: 'Rule updated successfully',
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

  // Asset Column Aliases CRUD Endpoints

  @Get('aliases')
  @ApiOperation({ summary: 'Get all asset column aliases' })
  @ApiResponse({ status: 200, description: 'Aliases retrieved successfully' })
  public async getAllAliases(): Promise<{
    aliases: Array<{
      id: string;
      assetField: string;
      csvAlias: string;
      confidence: number;
      createdAt: Date;
      createdBy: string | null;
    }>;
    totalCount: number;
  }> {
    const aliases = await this.pipelineService.getAllAliases();
    return {
      aliases: aliases.map((alias) => ({
        id: alias.id,
        assetField: alias.asset_field,
        csvAlias: alias.csv_alias,
        confidence: Number(alias.confidence),
        createdAt: alias.created_at,
        createdBy: alias.created_by,
      })),
      totalCount: aliases.length,
    };
  }

  @Post('aliases')
  @ApiOperation({ summary: 'Create a new asset column alias' })
  @ApiResponse({ status: 201, description: 'Alias created successfully' })
  public async createAlias(
    @Body()
    createAliasDto: {
      assetField: string;
      csvAlias: string;
      confidence?: number;
    },
  ): Promise<{ alias: Record<string, unknown>; message: string }> {
    const alias = await this.pipelineService.createAlias({
      asset_field: createAliasDto.assetField,
      csv_alias: createAliasDto.csvAlias,
      confidence: createAliasDto.confidence ?? 1.0,
    });
    return this.buildAliasResponse(alias, 'created');
  }

  @Patch('aliases/:aliasId')
  @ApiOperation({ summary: 'Update an existing asset column alias' })
  @ApiResponse({ status: 200, description: 'Alias updated successfully' })
  public async updateAlias(
    @Param('aliasId') aliasId: string,
    @Body()
    updateAliasDto: {
      assetField?: string;
      csvAlias?: string;
      confidence?: number;
    },
  ): Promise<{ alias: Record<string, unknown>; message: string }> {
    const updateData = this.buildUpdateData(updateAliasDto);
    const alias = await this.pipelineService.updateAlias(aliasId, updateData);
    return this.buildAliasResponse(alias, 'updated');
  }

  private buildUpdateData(updateAliasDto: {
    assetField?: string;
    csvAlias?: string;
    confidence?: number;
  }): Record<string, unknown> {
    const updateData: Record<string, unknown> = {};
    if (updateAliasDto.assetField !== undefined) {
      updateData.asset_field = updateAliasDto.assetField;
    }
    if (updateAliasDto.csvAlias !== undefined) {
      updateData.csv_alias = updateAliasDto.csvAlias;
    }
    if (updateAliasDto.confidence !== undefined) {
      updateData.confidence = updateAliasDto.confidence;
    }
    return updateData;
  }

  private buildAliasResponse(
    alias: {
      id: string;
      asset_field: string;
      csv_alias: string;
      confidence: unknown;
    },
    action: string,
  ): { alias: Record<string, unknown>; message: string } {
    return {
      alias: {
        id: alias.id,
        assetField: alias.asset_field,
        csvAlias: alias.csv_alias,
        confidence: Number(alias.confidence),
      },
      message: `Alias ${action} successfully`,
    };
  }

  @Delete('aliases/:aliasId')
  @ApiOperation({ summary: 'Delete an asset column alias' })
  @ApiResponse({ status: 200, description: 'Alias deleted successfully' })
  public async deleteAlias(@Param('aliasId') aliasId: string): Promise<{
    message: string;
  }> {
    await this.pipelineService.deleteAlias(aliasId);
    return { message: 'Alias deleted successfully' };
  }

  @Get('jobs/:jobId/phase-results')
  @ApiOperation({ summary: 'Get detailed phase results for ETL job' })
  @ApiResponse({
    status: 200,
    description: 'Phase results retrieved successfully',
  })
  public async getPhaseResults(
    @Param('jobId') jobId: string,
  ): Promise<GetPhaseResultsResponseDto> {
    return await this.pipelineService.getPhaseResults(jobId);
  }

  @Get('jobs/:jobId/phase-results/download')
  @ApiOperation({ summary: 'Download ETL phase results as JSON file' })
  @ApiResponse({ status: 200, description: 'Phase results file downloaded' })
  @Header('Content-Type', 'application/json')
  public async downloadPhaseResults(
    @Param('jobId') jobId: string,
    @Res() res: Response,
  ): Promise<void> {
    const phaseResults = await this.pipelineService.getPhaseResults(jobId);
    const fileName = this.generateFileName(jobId);

    this.setDownloadHeaders(res, fileName);

    const downloadData = this.buildDownloadData(jobId, fileName, phaseResults);
    res.json(downloadData);
  }

  private generateFileName(jobId: string): string {
    const DATE_LENGTH = 10;
    const dateStr = new Date().toISOString().slice(0, DATE_LENGTH);
    return `etl-phase-results-${jobId}-${dateStr}.json`;
  }

  private setDownloadHeaders(res: Response, fileName: string): void {
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/json');
  }

  private buildDownloadData(
    jobId: string,
    fileName: string,
    phaseResults: unknown,
  ): Record<string, unknown> {
    return {
      downloadInfo: {
        jobId,
        downloadedAt: new Date(),
        fileName,
      },
      ...(phaseResults as Record<string, unknown>),
    };
  }
}
