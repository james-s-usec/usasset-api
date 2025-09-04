import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RuleProcessorFactory } from './rule-processor.factory';
import { PipelinePhase, RuleType } from '@prisma/client';
import {
  ProcessingContext,
  ProcessingResult,
} from '../interfaces/rule-processor.interface';

@Injectable()
export class RuleEngineService {
  private readonly logger = new Logger(RuleEngineService.name);

  public constructor(
    private readonly prisma: PrismaService,
    private readonly processorFactory: RuleProcessorFactory,
  ) {}

  public async processDataWithRules(
    data: any,
    phase: PipelinePhase,
    context: ProcessingContext,
  ): Promise<{
    success: boolean;
    data: any;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let processedData = data;

    try {
      // Load active rules for this phase, ordered by priority
      const rules = await this.prisma.pipelineRule.findMany({
        where: {
          phase,
          is_active: true,
        },
        orderBy: {
          priority: 'asc', // Lower number = higher priority
        },
      });

      this.logger.debug(
        `Found ${rules.length} active rules for phase ${phase}`,
      );

      // Process each rule in order
      for (const rule of rules) {
        try {
          const processor = this.processorFactory.createProcessor(rule.type);
          if (!processor) {
            warnings.push(`No processor found for rule type: ${rule.type}`);
            continue;
          }

          // Validate rule configuration
          const configValidation = await processor.validateConfig(rule.config);
          if (!configValidation.success) {
            errors.push(
              `Rule "${rule.name}" has invalid config: ${configValidation.errors?.join(', ')}`,
            );
            continue;
          }

          // Apply the rule if it targets this field or all fields
          const shouldApply =
            rule.target === '*' ||
            (typeof data === 'object' && data && rule.target in data);

          if (shouldApply) {
            const targetData =
              rule.target === '*' ? processedData : processedData[rule.target];
            const result = await processor.process(
              targetData,
              configValidation.data,
              context,
            );

            if (result.success) {
              if (rule.target === '*') {
                processedData = result.data;
              } else {
                processedData[rule.target] = result.data;
              }

              if (result.warnings) {
                warnings.push(...result.warnings);
              }

              this.logger.debug(`Applied rule "${rule.name}" successfully`);
            } else {
              if (result.errors) {
                errors.push(
                  ...result.errors.map((err) => `Rule "${rule.name}": ${err}`),
                );
              }
            }
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          errors.push(`Failed to apply rule "${rule.name}": ${errorMessage}`);
        }
      }

      return {
        success: errors.length === 0,
        data: processedData,
        errors,
        warnings,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        data: data,
        errors: [`Rule engine failed: ${errorMessage}`],
        warnings,
      };
    }
  }

  public async getRulesForPhase(phase: PipelinePhase): Promise<any[]> {
    return this.prisma.pipelineRule.findMany({
      where: {
        phase,
        is_active: true,
      },
      orderBy: {
        priority: 'asc',
      },
    });
  }

  public async createRule(ruleData: {
    name: string;
    description?: string;
    phase: PipelinePhase;
    type: RuleType;
    target: string;
    config: any;
    priority?: number;
  }): Promise<any> {
    return this.prisma.pipelineRule.create({
      data: {
        ...ruleData,
        priority: ruleData.priority ?? 100,
      },
    });
  }
}
