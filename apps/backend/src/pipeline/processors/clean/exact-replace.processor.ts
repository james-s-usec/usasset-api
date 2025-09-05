import { Injectable } from '@nestjs/common';
import { RuleType, PipelinePhase } from '@prisma/client';
import {
  RuleProcessor,
  ValidationResult,
  ProcessingResult,
  ProcessingContext,
} from '../../interfaces/rule-processor.interface';

export interface ExactReplaceConfig {
  replacements: Array<{
    from: string;
    to: string;
  }>;
  caseSensitive?: boolean;
}

@Injectable()
export class ExactReplaceProcessor
  implements RuleProcessor<ExactReplaceConfig>
{
  public readonly type = RuleType.EXACT_REPLACE;
  public readonly phase = PipelinePhase.CLEAN;

  public validateConfig(
    config: unknown,
  ): Promise<ValidationResult<ExactReplaceConfig>> {
    return Promise.resolve(this.performValidation(config));
  }

  private performValidation(
    config: unknown,
  ): ValidationResult<ExactReplaceConfig> {
    try {
      if (typeof config !== 'object' || config === null) {
        return {
          success: false,
          errors: ['Config must be an object'],
        };
      }

      const configObj = config as Record<string, unknown>;

      if (!Array.isArray(configObj.replacements)) {
        return {
          success: false,
          errors: ['replacements must be an array'],
        };
      }

      for (const replacement of configObj.replacements) {
        if (typeof replacement !== 'object' || replacement === null) {
          return {
            success: false,
            errors: ['Each replacement must be an object'],
          };
        }
        const replObj = replacement as Record<string, unknown>;
        if (
          typeof replObj.from !== 'string' ||
          typeof replObj.to !== 'string'
        ) {
          return {
            success: false,
            errors: [
              'Each replacement must have "from" and "to" string properties',
            ],
          };
        }
      }

      const exactConfig: ExactReplaceConfig = {
        replacements: configObj.replacements as Array<{
          from: string;
          to: string;
        }>,
        caseSensitive:
          typeof configObj.caseSensitive === 'boolean'
            ? configObj.caseSensitive
            : true,
      };

      return { success: true, data: exactConfig };
    } catch (error) {
      return {
        success: false,
        errors: [
          `Config validation failed: ${error instanceof Error ? error.message : String(error)}`,
        ],
      };
    }
  }

  public process(
    data: unknown,
    config: ExactReplaceConfig,
    context: ProcessingContext,
  ): Promise<ProcessingResult> {
    return Promise.resolve(this.performProcessing(data, config, context));
  }

  private performProcessing(
    data: unknown,
    config: ExactReplaceConfig,
    context: ProcessingContext,
  ): ProcessingResult {
    try {
      if (typeof data !== 'string') {
        return {
          success: true,
          data: data,
          warnings: [
            `Row ${context.rowNumber}: Exact replace processor received non-string data, skipping`,
          ],
        };
      }

      let result = data;
      let totalReplacements = 0;

      // Sort replacements by length (longest first) to avoid partial replacements
      const sortedReplacements = [...config.replacements].sort(
        (a, b) => b.from.length - a.from.length,
      );

      for (const replacement of sortedReplacements) {
        if (config.caseSensitive) {
          const count = (
            result.match(
              new RegExp(
                replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                'g',
              ),
            ) || []
          ).length;
          result = result.split(replacement.from).join(replacement.to);
          totalReplacements += count;
        } else {
          const regex = new RegExp(
            replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            'gi',
          );
          const count = (result.match(regex) || []).length;
          result = result.replace(regex, replacement.to);
          totalReplacements += count;
        }
      }

      return {
        success: true,
        data: result,
        metadata: {
          originalValue: data,
          replacedValue: result,
          replacementCount: totalReplacements,
          operation: 'exact-replace',
        },
      };
    } catch (error) {
      return {
        success: false,
        data: data,
        errors: [
          `Exact replace processing failed: ${error instanceof Error ? error.message : String(error)}`,
        ],
      };
    }
  }
}
