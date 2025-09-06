import { Injectable, Logger } from '@nestjs/common';
import { PipelinePhase } from '@prisma/client';
import {
  PhaseProcessor,
  PhaseContext,
  PhaseResult,
} from '../../orchestrator/phase-processor.interface';
import { RuleEngineService } from '../../services/rule-engine.service';
import { PrismaService } from '../../../database/prisma.service';
import { ProcessingContext } from '../../interfaces/rule-processor.interface';
import { PipelineLogger } from '../../utils/pipeline-logger.util';
import { PhaseValidators } from '../../utils/phase-validators.util';
import { PipelineErrorHandler } from '../../utils/pipeline-error-handler.util';

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

  public constructor(
    private readonly prisma: PrismaService,
    private readonly ruleEngine: RuleEngineService,
  ) {
    // RuleEngineService is now injected with proper factory registration
  }

  public async process(
    data: Record<string, unknown>,
    context: PhaseContext,
  ): Promise<PhaseResult> {
    const startTime = new Date();
    PipelineLogger.logPhaseStart(
      this.logger,
      this.phase,
      context.correlationId,
    );

    try {
      PhaseValidators.validateRowsInput(data);
      await this.ensureDemoRules();

      const result = await this.processRows(data, context);

      return this.createSuccessResult(
        startTime,
        result.cleanedData,
        result.transformations,
        result.rulesApplied,
      );
    } catch (error) {
      return PipelineErrorHandler.createPhaseResult(
        this.phase,
        error,
        context.correlationId,
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
      const rowResult = await this.processSingleRow(
        validRows[i],
        i,
        context,
        validRows.length,
      );

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
    totalRows?: number,
  ): Promise<{
    cleanedRow: Record<string, unknown>;
    transformations: Transformation[];
    appliedRules: string[];
  }> {
    PipelineLogger.logRowProcessing(
      this.logger,
      context.correlationId,
      index + 1,
      totalRows,
    );

    const ruleResult = await this.processRowWithRules(row, index, context);
    if (!ruleResult.success) {
      return this.handleFailedRow(row, index, context, ruleResult);
    }

    return this.createSuccessfulRowResult(row, ruleResult.data, index);
  }

  private handleFailedRow(
    row: Record<string, unknown>,
    index: number,
    context: PhaseContext,
    ruleResult: { errors: string[] },
  ): {
    cleanedRow: Record<string, unknown>;
    transformations: Transformation[];
    appliedRules: string[];
  } {
    this.handleRuleFailure(context, index, ruleResult);
    return this.createFailedRowResult(row);
  }

  private async createSuccessfulRowResult(
    originalRow: Record<string, unknown>,
    cleanedData: Record<string, unknown>,
    index: number,
  ): Promise<{
    cleanedRow: Record<string, unknown>;
    transformations: Transformation[];
    appliedRules: string[];
  }> {
    const transformations = this.detectTransformations(
      originalRow,
      cleanedData,
      index,
    );
    const appliedRules = await this.getAppliedRuleNames();

    return {
      cleanedRow: cleanedData,
      transformations,
      appliedRules,
    };
  }

  private async processRowWithRules(
    row: Record<string, unknown>,
    index: number,
    context: PhaseContext,
  ): Promise<{
    success: boolean;
    data: Record<string, unknown>;
    errors: string[];
  }> {
    const ruleContext = this.createRuleContext(row, index, context);
    return this.ruleEngine.processDataWithRules(
      row,
      PipelinePhase.CLEAN,
      ruleContext,
    );
  }

  private createFailedRowResult(row: Record<string, unknown>): {
    cleanedRow: Record<string, unknown>;
    transformations: Transformation[];
    appliedRules: string[];
  } {
    return {
      cleanedRow: row,
      transformations: [],
      appliedRules: [],
    };
  }

  private async getAppliedRuleNames(): Promise<string[]> {
    const activeRules = await this.ruleEngine.getRulesForPhase(
      PipelinePhase.CLEAN,
    );
    return activeRules.map((r) => r.name);
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
    const recordsProcessed = this.getRecordsProcessed(cleanedData);

    this.logPhaseCompletion(recordsProcessed, durationMs);

    return {
      success: true,
      phase: this.phase,
      data: cleanedData,
      errors: [],
      warnings: [],
      metrics: this.buildMetrics(
        startTime,
        endTime,
        durationMs,
        recordsProcessed,
      ),
      debug: this.buildDebugInfo(rulesApplied, transformations),
    };
  }

  private logPhaseCompletion(
    recordsProcessed: number,
    durationMs: number,
  ): void {
    PipelineLogger.logPhaseComplete(
      this.logger,
      this.phase,
      'completed', // correlationId would need to be passed here
      recordsProcessed,
      durationMs,
    );
  }

  private getRecordsProcessed(cleanedData: CleanedData): number {
    const validRows = cleanedData.validRows as unknown[];
    return validRows ? validRows.length : 0;
  }

  private buildMetrics(
    startTime: Date,
    endTime: Date,
    durationMs: number,
    recordsProcessed: number,
  ): {
    startTime: Date;
    endTime: Date;
    durationMs: number;
    recordsProcessed: number;
    recordsSuccess: number;
    recordsFailed: number;
  } {
    return {
      startTime,
      endTime,
      durationMs,
      recordsProcessed,
      recordsSuccess: recordsProcessed,
      recordsFailed: 0,
    };
  }

  private buildDebugInfo(
    rulesApplied: string[],
    transformations: Transformation[],
  ): { rulesApplied: string[]; transformations: Transformation[] } {
    return {
      rulesApplied,
      transformations,
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
