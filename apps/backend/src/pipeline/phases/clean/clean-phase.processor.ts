import { Injectable, Logger } from '@nestjs/common';
import { PipelinePhase } from '@prisma/client';
import {
  PhaseProcessor,
  PhaseContext,
  PhaseResult,
} from '../../orchestrator/phase-processor.interface';
import { RuleEngineService } from '../../services/rule-engine.service';
import { RuleProcessorFactory } from '../../services/rule-processor.factory';
import { PrismaService } from '../../../database/prisma.service';
import { ProcessingContext } from '../../interfaces/rule-processor.interface';

interface CleanedData extends Record<string, unknown> {
  cleanedRows: Array<Record<string, unknown>>;
}

interface Transformation {
  field: string;
  before: unknown;
  after: unknown;
}

@Injectable()
export class CleanPhaseProcessor implements PhaseProcessor {
  public readonly phase = PipelinePhase.CLEAN;
  public readonly name = 'Data Cleaner';
  public readonly description =
    'Applies cleaning rules: TRIM, REGEX_REPLACE, etc.';

  private readonly logger = new Logger(CleanPhaseProcessor.name);
  private readonly ruleEngine: RuleEngineService;

  public constructor(private readonly prisma: PrismaService) {
    const factory = new RuleProcessorFactory();
    this.ruleEngine = new RuleEngineService(prisma, factory);
  }

  public async process(
    data: Record<string, unknown>,
    context: PhaseContext,
  ): Promise<PhaseResult> {
    const startTime = new Date();
    this.logger.debug(`[${context.correlationId}] Starting CLEAN phase`);

    try {
      this.validateInput(data);
      await this.ensureDemoRules();

      const result = await this.processRows(data, context);

      return this.createSuccessResult(
        startTime,
        result.cleanedData,
        result.transformations,
        result.rulesApplied,
      );
    } catch (error) {
      return this.createErrorResult(startTime, data, error);
    }
  }

  private validateInput(data: Record<string, unknown>): void {
    if (!data.validRows || !Array.isArray(data.validRows)) {
      throw new Error(
        'Invalid input: expected validRows array from VALIDATE phase',
      );
    }
  }

  private async processRows(
    data: Record<string, unknown>,
    context: PhaseContext,
  ): Promise<{
    cleanedData: CleanedData;
    transformations: Transformation[];
    rulesApplied: string[];
  }> {
    const cleanedData: CleanedData = {
      ...data,
      cleanedRows: [],
    };

    const transformations: Transformation[] = [];
    const rulesApplied: string[] = [];
    const validRows = data.validRows as Array<Record<string, unknown>>;

    for (let i = 0; i < validRows.length; i++) {
      const rowResult = await this.processSingleRow(validRows[i], i, context);

      cleanedData.cleanedRows.push(rowResult.cleanedRow);
      transformations.push(...rowResult.transformations);
      this.addUniqueRules(rulesApplied, rowResult.appliedRules);
    }

    return { cleanedData, transformations, rulesApplied };
  }

  private async processSingleRow(
    row: Record<string, unknown>,
    index: number,
    context: PhaseContext,
  ): Promise<{
    cleanedRow: Record<string, unknown>;
    transformations: Transformation[];
    appliedRules: string[];
  }> {
    this.logger.debug(
      `[${context.correlationId}] Processing row ${index + 1} through CLEAN rules`,
    );

    const ruleContext = this.createRuleContext(row, index, context);
    const ruleResult = await this.ruleEngine.processDataWithRules(
      row,
      PipelinePhase.CLEAN,
      ruleContext,
    );

    if (!ruleResult.success) {
      this.handleRuleFailure(context, index, ruleResult);
      return {
        cleanedRow: row,
        transformations: [],
        appliedRules: [],
      };
    }

    const transformations = this.detectTransformations(
      row,
      ruleResult.data,
      index,
    );
    const activeRules = await this.ruleEngine.getRulesForPhase(
      PipelinePhase.CLEAN,
    );

    return {
      cleanedRow: ruleResult.data,
      transformations,
      appliedRules: activeRules.map((r: any) => r.name),
    };
  }

  private createRuleContext(
    row: Record<string, unknown>,
    index: number,
    context: PhaseContext,
  ): ProcessingContext {
    return {
      rowNumber: index + 1,
      jobId: context.jobId,
      correlationId: context.correlationId,
      metadata: { ...context.metadata, originalRow: row },
    };
  }

  private detectTransformations(
    originalRow: Record<string, unknown>,
    cleanedRow: Record<string, unknown>,
    index: number,
  ): Transformation[] {
    const transformations: Transformation[] = [];

    Object.keys(originalRow).forEach((key) => {
      if (originalRow[key] !== cleanedRow[key]) {
        transformations.push({
          field: `${key}_row_${index + 1}`,
          before: originalRow[key],
          after: cleanedRow[key],
        });
      }
    });

    return transformations;
  }

  private handleRuleFailure(
    context: PhaseContext,
    index: number,
    ruleResult: { errors: string[] },
  ): void {
    this.logger.warn(
      `[${context.correlationId}] Rule processing failed for row ${index + 1}: ${ruleResult.errors.join(', ')}`,
    );
  }

  private addUniqueRules(target: string[], newRules: string[]): void {
    newRules.forEach((rule) => {
      if (!target.includes(rule)) {
        target.push(rule);
      }
    });
  }

  private createSuccessResult(
    startTime: Date,
    cleanedData: CleanedData,
    transformations: Transformation[],
    rulesApplied: string[],
  ): PhaseResult {
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    const validRows = cleanedData.validRows as unknown[];
    const recordsProcessed = validRows ? validRows.length : 0;

    this.logger.debug(
      `CLEAN phase completed: ${recordsProcessed} records cleaned in ${durationMs}ms`,
    );

    return {
      success: true,
      phase: this.phase,
      data: cleanedData,
      errors: [],
      warnings: [],
      metrics: {
        startTime,
        endTime,
        durationMs,
        recordsProcessed,
        recordsSuccess: recordsProcessed,
        recordsFailed: 0,
      },
      debug: {
        rulesApplied,
        transformations,
      },
    };
  }

  private createErrorResult(
    startTime: Date,
    data: Record<string, unknown>,
    error: unknown,
  ): PhaseResult {
    const endTime = new Date();
    const errorMessage = error instanceof Error ? error.message : String(error);

    this.logger.error(`CLEAN phase failed: ${errorMessage}`);

    return {
      success: false,
      phase: this.phase,
      data,
      errors: [`CLEAN failed: ${errorMessage}`],
      warnings: [],
      metrics: {
        startTime,
        endTime,
        durationMs: endTime.getTime() - startTime.getTime(),
        recordsProcessed: 0,
        recordsSuccess: 0,
        recordsFailed: 1,
      },
    };
  }

  private async ensureDemoRules(): Promise<void> {
    const existingRules = await this.ruleEngine.getRulesForPhase(
      PipelinePhase.CLEAN,
    );

    if (existingRules.length === 0) {
      await this.createDemoRules();
    }
  }

  private async createDemoRules(): Promise<void> {
    this.logger.debug('No CLEAN rules found, creating demo TRIM rules');

    const trimConfig = {
      sides: 'both',
      customChars: ' \t\n\r',
    };

    await Promise.all([
      this.ruleEngine.createRule({
        name: 'Asset Name TRIM Rule',
        description: 'Remove whitespace from Asset Name field',
        phase: PipelinePhase.CLEAN,
        type: 'TRIM',
        target: 'Asset Name',
        config: trimConfig,
        priority: 1,
      }),
      this.ruleEngine.createRule({
        name: 'Asset Tag TRIM Rule',
        description: 'Remove whitespace from Asset Tag field',
        phase: PipelinePhase.CLEAN,
        type: 'TRIM',
        target: 'Asset Tag',
        config: trimConfig,
        priority: 2,
      }),
    ]);
  }
}
