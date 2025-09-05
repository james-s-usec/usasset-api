import { Injectable, Logger } from '@nestjs/common';
import { PipelinePhase, RuleType, PipelineRule, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RuleProcessorFactory } from './rule-processor.factory';
import { ProcessingContext } from '../interfaces/rule-processor.interface';

export interface CreateRuleDto {
  name: string;
  description: string;
  phase: PipelinePhase;
  type: RuleType;
  target: string;
  config: Record<string, unknown>;
  priority: number;
  is_active?: boolean;
}

export interface RuleEngineProcessResult {
  success: boolean;
  data: Record<string, unknown>;
  errors: string[];
  warnings: string[];
  metadata?: Record<string, unknown>;
}

interface RuleProcessor {
  process: (
    data: unknown,
    config: unknown,
    context: ProcessingContext,
  ) => Promise<{
    success: boolean;
    data?: unknown;
    errors?: string[];
    warnings?: string[];
  }>;
}

interface RuleParams {
  data: Record<string, unknown>;
  config: unknown;
  context: ProcessingContext;
  ruleName: string;
}

interface RuleResult {
  success: boolean;
  data?: Record<string, unknown>;
  warnings?: string[];
  error?: string;
}

interface SingleRuleResult extends RuleResult {
  processor?: unknown;
  configError?: string;
}

@Injectable()
export class RuleEngineService {
  private readonly logger = new Logger(RuleEngineService.name);

  public constructor(
    private readonly prisma: PrismaService,
    private readonly processorFactory: RuleProcessorFactory,
  ) {}

  public async createRule(createRuleDto: CreateRuleDto): Promise<PipelineRule> {
    this.logger.debug(`Creating rule: ${createRuleDto.name}`);

    return await this.prisma.pipelineRule.create({
      data: {
        name: createRuleDto.name,
        description: createRuleDto.description,
        phase: createRuleDto.phase,
        type: createRuleDto.type,
        target: createRuleDto.target,
        config: createRuleDto.config as Prisma.InputJsonValue,
        priority: createRuleDto.priority,
        is_active: createRuleDto.is_active ?? true,
      },
    });
  }

  public async getRulesForPhase(phase: PipelinePhase): Promise<PipelineRule[]> {
    this.logger.debug(`Getting rules for phase: ${phase}`);

    return await this.prisma.pipelineRule.findMany({
      where: {
        phase: phase,
        is_active: true,
      },
      orderBy: [{ priority: 'asc' }, { created_at: 'asc' }],
    });
  }

  public async processDataWithRules(
    data: Record<string, unknown>,
    phase: PipelinePhase,
    context: ProcessingContext,
  ): Promise<RuleEngineProcessResult> {
    this.logger.debug(`Processing data with ${phase} rules`, {
      correlationId: context.correlationId,
      rowNumber: context.rowNumber,
    });

    try {
      // Get active rules for this phase
      const rules = await this.getRulesForPhase(phase);

      if (rules.length === 0) {
        return this.createNoRulesResult(data, phase);
      }

      // Process all rules
      const processResult = await this.processAllRules(rules, data, context);

      return this.createProcessResult(processResult, rules.length, phase);
    } catch (error) {
      return this.createErrorResult(data, error);
    }
  }

  /**
   * Create result when no rules are found
   */
  private createNoRulesResult(
    data: Record<string, unknown>,
    phase: PipelinePhase,
  ): RuleEngineProcessResult {
    this.logger.debug(`No active rules found for phase: ${phase}`);
    return {
      success: true,
      data: { ...data },
      errors: [],
      warnings: [`No rules found for phase: ${phase}`],
    };
  }

  /**
   * Process all rules in priority order
   */
  private async processAllRules(
    rules: PipelineRule[],
    data: Record<string, unknown>,
    context: ProcessingContext,
  ): Promise<{
    processedData: Record<string, unknown>;
    errors: string[];
    warnings: string[];
  }> {
    let processedData = { ...data };
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of rules) {
      const result = await this.processSingleRule(rule, processedData, context);
      this.handleRuleResult(result, rule, { errors, warnings });

      if (result.data) {
        processedData = { ...processedData, ...result.data };
      }
    }

    return { processedData, errors, warnings };
  }

  /**
   * Handle single rule result
   */
  private handleRuleResult(
    result: {
      success: boolean;
      data?: Record<string, unknown>;
      warnings?: string[];
      error?: string;
      processor?: unknown;
      configError?: string;
    },
    rule: PipelineRule,
    collections: { errors: string[]; warnings: string[] },
  ): void {
    if (this.shouldSkipProcessorResult(result, collections)) {
      return;
    }

    if (this.shouldAddConfigError(result, collections)) {
      return;
    }

    this.handleProcessorResult(result, rule, collections);
  }

  private shouldSkipProcessorResult(
    result: { processor?: unknown; error?: string },
    collections: { warnings: string[] },
  ): boolean {
    if (result.processor === null) {
      collections.warnings.push(result.error || 'Unknown processor error');
      return true;
    }
    return false;
  }

  private shouldAddConfigError(
    result: { configError?: string },
    collections: { errors: string[] },
  ): boolean {
    if (result.configError) {
      collections.errors.push(result.configError);
      return true;
    }
    return false;
  }

  private handleProcessorResult(
    result: {
      success: boolean;
      warnings?: string[];
      error?: string;
    },
    rule: PipelineRule,
    collections: { errors: string[]; warnings: string[] },
  ): void {
    if (result.success) {
      this.handleSuccessResult(result, rule, collections);
    } else if (result.error) {
      collections.errors.push(result.error);
    }
  }

  private handleSuccessResult(
    result: { warnings?: string[] },
    rule: PipelineRule,
    collections: { warnings: string[] },
  ): void {
    if (result.warnings?.length) {
      collections.warnings.push(...result.warnings);
    }
    this.logger.debug(`Applied rule: ${rule.name} to ${rule.target}`);
  }

  /**
   * Process a single rule
   */
  private async processSingleRule(
    rule: PipelineRule,
    data: Record<string, unknown>,
    context: ProcessingContext,
  ): Promise<SingleRuleResult> {
    try {
      const processor = this.processorFactory.createProcessor(rule.type);
      if (!processor) {
        return this.createProcessorNotFoundError(rule.type);
      }

      const configValidation = await processor.validateConfig(rule.config);
      if (!configValidation.success) {
        return this.createConfigError(rule.name, configValidation.errors);
      }

      return await this.applyRule(processor, {
        data,
        config: configValidation.data,
        context,
        ruleName: rule.name,
      });
    } catch (ruleError) {
      return this.createRuleError(rule.name, ruleError);
    }
  }

  private createProcessorNotFoundError(ruleType: RuleType): {
    success: boolean;
    processor: null;
    error: string;
  } {
    const error = `No processor found for rule type: ${ruleType}`;
    this.logger.warn(error);
    return { success: false, processor: null, error };
  }

  private createConfigError(
    ruleName: string,
    errors?: string[],
  ): {
    success: boolean;
    configError: string;
  } {
    const configError = `Invalid config for rule ${ruleName}: ${errors?.join(', ')}`;
    this.logger.error(configError);
    return { success: false, configError };
  }

  private async applyRule(
    processor: RuleProcessor,
    ruleParams: RuleParams,
  ): Promise<RuleResult> {
    const result = await processor.process(
      ruleParams.data,
      ruleParams.config,
      ruleParams.context,
    );

    if (result.success) {
      return {
        success: true,
        data: result.data as Record<string, unknown> | undefined,
        warnings: result.warnings,
      };
    } else {
      const error = `Rule ${ruleParams.ruleName} failed: ${result.errors?.join(', ')}`;
      this.logger.error(error);
      return { success: false, error };
    }
  }

  private createRuleError(
    ruleName: string,
    ruleError: unknown,
  ): {
    success: boolean;
    error: string;
  } {
    const error = `Error processing rule ${ruleName}: ${ruleError instanceof Error ? ruleError.message : String(ruleError)}`;
    this.logger.error(error);
    return { success: false, error };
  }

  /**
   * Create process result
   */
  private createProcessResult(
    processResult: {
      processedData: Record<string, unknown>;
      errors: string[];
      warnings: string[];
    },
    rulesApplied: number,
    phase: PipelinePhase,
  ): RuleEngineProcessResult {
    return {
      success: processResult.errors.length === 0,
      data: processResult.processedData,
      errors: processResult.errors,
      warnings: processResult.warnings,
      metadata: {
        rulesApplied,
        phase,
      },
    };
  }

  /**
   * Create error result
   */
  private createErrorResult(
    data: Record<string, unknown>,
    error: unknown,
  ): RuleEngineProcessResult {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.logger.error(`Failed to process data with rules: ${errorMessage}`);

    return {
      success: false,
      data: { ...data },
      errors: [`Processing failed: ${errorMessage}`],
      warnings: [],
    };
  }

  public async updateRule(
    ruleId: string,
    updates: Partial<CreateRuleDto>,
  ): Promise<PipelineRule> {
    this.logger.debug(`Updating rule: ${ruleId}`);

    const updateData = this.buildUpdateData(updates);

    return await this.prisma.pipelineRule.update({
      where: { id: ruleId },
      data: updateData,
    });
  }

  /**
   * Build update data from partial DTO
   */
  private buildUpdateData(
    updates: Partial<CreateRuleDto>,
  ): Record<string, unknown> {
    const updateData: Record<string, unknown> = {};

    const fieldMappings = this.getFieldMappings();

    for (const mapping of fieldMappings) {
      const value = updates[mapping.field];
      if (value !== undefined) {
        updateData[mapping.dbField] = mapping.transform
          ? mapping.transform(value)
          : value;
      }
    }

    return updateData;
  }

  private getFieldMappings(): Array<{
    field: keyof CreateRuleDto;
    dbField: string;
    transform?: (value: unknown) => unknown;
  }> {
    return [
      { field: 'name', dbField: 'name' },
      { field: 'description', dbField: 'description' },
      {
        field: 'phase',
        dbField: 'phase',
        transform: (v) => v as PipelinePhase,
      },
      { field: 'type', dbField: 'type', transform: (v) => v as RuleType },
      { field: 'target', dbField: 'target' },
      { field: 'config', dbField: 'config' },
      { field: 'priority', dbField: 'priority' },
      { field: 'is_active', dbField: 'is_active' },
    ];
  }

  public async deleteRule(ruleId: string): Promise<void> {
    this.logger.debug(`Deleting rule: ${ruleId}`);

    await this.prisma.pipelineRule.delete({
      where: { id: ruleId },
    });
  }

  public async getAllRules(): Promise<PipelineRule[]> {
    this.logger.debug('Getting all pipeline rules');

    return await this.prisma.pipelineRule.findMany({
      orderBy: [{ phase: 'asc' }, { priority: 'asc' }, { name: 'asc' }],
    });
  }
}
