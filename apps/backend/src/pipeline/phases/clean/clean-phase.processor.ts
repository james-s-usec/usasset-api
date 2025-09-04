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

@Injectable()
export class CleanPhaseProcessor implements PhaseProcessor {
  public readonly phase = PipelinePhase.CLEAN;
  public readonly name = 'Data Cleaner';
  public readonly description =
    'Applies cleaning rules: TRIM, REGEX_REPLACE, etc.';

  private readonly logger = new Logger(CleanPhaseProcessor.name);
  private readonly ruleEngine: RuleEngineService;

  public constructor(private readonly prisma: PrismaService) {
    // Initialize rule engine for CLEAN phase
    const factory = new RuleProcessorFactory();
    this.ruleEngine = new RuleEngineService(this.prisma, factory);
  }

  public async process(data: any, context: PhaseContext): Promise<PhaseResult> {
    const startTime = new Date();
    this.logger.debug(`[${context.correlationId}] Starting CLEAN phase`);

    try {
      if (!data.validRows || !Array.isArray(data.validRows)) {
        throw new Error(
          'Invalid input: expected validRows array from VALIDATE phase',
        );
      }

      const cleanedData = {
        ...data,
        cleanedRows: [],
      };

      const transformations: Array<{ field: string; before: any; after: any }> =
        [];
      const rulesApplied: string[] = [];

      // Ensure we have demo TRIM rule in database
      await this.ensureDemoRules();

      // Process each valid row through REAL rules engine
      for (let i = 0; i < data.validRows.length; i++) {
        const row = data.validRows[i];

        this.logger.debug(
          `[${context.correlationId}] Processing row ${i + 1} through CLEAN rules`,
        );

        // Use actual rules engine to process the row
        const ruleContext = {
          rowNumber: i + 1,
          jobId: context.jobId,
          correlationId: context.correlationId,
          metadata: { ...context.metadata, originalRow: row },
        };

        const ruleResult = await this.ruleEngine.processDataWithRules(
          row,
          PipelinePhase.CLEAN,
          ruleContext,
        );

        if (ruleResult.success) {
          cleanedData.cleanedRows.push(ruleResult.data);

          // Track what rules were actually applied
          const activeRules = await this.ruleEngine.getRulesForPhase(
            PipelinePhase.CLEAN,
          );
          for (const rule of activeRules) {
            if (!rulesApplied.includes(rule.name)) {
              rulesApplied.push(rule.name);
            }
          }

          // Record transformations for each field that changed
          Object.keys(row).forEach((key) => {
            if (row[key] !== ruleResult.data[key]) {
              transformations.push({
                field: `${key}_row_${i + 1}`,
                before: row[key],
                after: ruleResult.data[key],
              });
            }
          });
        } else {
          // Rule processing failed, use original row
          this.logger.warn(
            `[${context.correlationId}] Rule processing failed for row ${i + 1}: ${ruleResult.errors.join(', ')}`,
          );
          cleanedData.cleanedRows.push(row);
        }
      }

      const endTime = new Date();
      const durationMs = endTime.getTime() - startTime.getTime();
      const recordsProcessed = data.validRows.length;

      this.logger.debug(
        `[${context.correlationId}] CLEAN phase completed: ${recordsProcessed} records cleaned in ${durationMs}ms`,
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
    } catch (error) {
      const endTime = new Date();
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        `[${context.correlationId}] CLEAN phase failed: ${errorMessage}`,
      );

      return {
        success: false,
        phase: this.phase,
        data: data,
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
  }

  private async ensureDemoRules(): Promise<void> {
    // Check if we have any CLEAN rules, if not create demo TRIM rule
    const existingRules = await this.ruleEngine.getRulesForPhase(
      PipelinePhase.CLEAN,
    );

    if (existingRules.length === 0) {
      this.logger.debug('No CLEAN rules found, creating demo TRIM rule');

      await this.ruleEngine.createRule({
        name: 'Asset Name TRIM Rule',
        description: 'Remove whitespace from Asset Name field',
        phase: PipelinePhase.CLEAN,
        type: 'TRIM',
        target: 'Asset Name',
        config: {
          sides: 'both',
          customChars: ' \t\n\r',
        },
        priority: 1,
      });

      await this.ruleEngine.createRule({
        name: 'Asset Tag TRIM Rule',
        description: 'Remove whitespace from Asset Tag field',
        phase: PipelinePhase.CLEAN,
        type: 'TRIM',
        target: 'Asset Tag',
        config: {
          sides: 'both',
          customChars: ' \t\n\r',
        },
        priority: 2,
      });
    }
  }
}
