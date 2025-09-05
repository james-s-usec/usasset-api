import { Injectable } from '@nestjs/common';
import { RuleType, PipelinePhase } from '@prisma/client';
import {
  RuleProcessor,
  ValidationResult,
  ProcessingResult,
  ProcessingContext,
} from '../../interfaces/rule-processor.interface';

export interface RegexReplaceConfig {
  pattern: string;
  replacement: string;
  flags?: string;
}

@Injectable()
export class RegexReplaceProcessor
  implements RuleProcessor<RegexReplaceConfig>
{
  public readonly type = RuleType.REGEX_REPLACE;
  public readonly phase = PipelinePhase.CLEAN;

  public validateConfig(
    config: unknown,
  ): Promise<ValidationResult<RegexReplaceConfig>> {
    return Promise.resolve(this.performValidation(config));
  }

  private performValidation(
    config: unknown,
  ): ValidationResult<RegexReplaceConfig> {
    try {
      if (typeof config !== 'object' || config === null) {
        return {
          success: false,
          errors: ['Config must be an object'],
        };
      }

      const configObj = config as Record<string, unknown>;

      if (typeof configObj.pattern !== 'string') {
        return {
          success: false,
          errors: ['pattern must be a string'],
        };
      }

      if (typeof configObj.replacement !== 'string') {
        return {
          success: false,
          errors: ['replacement must be a string'],
        };
      }

      // Validate regex pattern
      try {
        new RegExp(configObj.pattern, configObj.flags as string);
      } catch (error) {
        return {
          success: false,
          errors: [
            `Invalid regex pattern: ${error instanceof Error ? error.message : String(error)}`,
          ],
        };
      }

      const regexConfig: RegexReplaceConfig = {
        pattern: configObj.pattern,
        replacement: configObj.replacement,
        flags: typeof configObj.flags === 'string' ? configObj.flags : 'g',
      };

      return { success: true, data: regexConfig };
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
    config: RegexReplaceConfig,
    context: ProcessingContext,
  ): Promise<ProcessingResult> {
    return Promise.resolve(this.performProcessing(data, config, context));
  }

  private performProcessing(
    data: unknown,
    config: RegexReplaceConfig,
    context: ProcessingContext,
  ): ProcessingResult {
    try {
      if (typeof data !== 'string') {
        return {
          success: true,
          data: data,
          warnings: [
            `Row ${context.rowNumber}: Regex replace processor received non-string data, skipping`,
          ],
        };
      }

      const regex = new RegExp(config.pattern, config.flags);
      const result = data.replace(regex, config.replacement);
      const matchCount = (data.match(regex) || []).length;

      return {
        success: true,
        data: result,
        metadata: {
          originalValue: data,
          replacedValue: result,
          matchCount,
          pattern: config.pattern,
          operation: 'regex-replace',
        },
      };
    } catch (error) {
      return {
        success: false,
        data: data,
        errors: [
          `Regex replace processing failed: ${error instanceof Error ? error.message : String(error)}`,
        ],
      };
    }
  }
}
