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
      const basicValidation = this.validateBasicStructure(config);
      if (!basicValidation.success) return basicValidation;

      const configObj = config as Record<string, unknown>;
      const fieldValidation = this.validateRequiredFields(configObj);
      if (!fieldValidation.success) return fieldValidation;

      const regexValidation = this.validateRegexPattern(
        configObj.pattern as string,
        configObj.flags as string,
      );
      if (!regexValidation.success) return regexValidation;

      return this.buildValidConfig(configObj);
    } catch (error) {
      return this.buildValidationError(error);
    }
  }

  private validateBasicStructure(config: unknown): ValidationResult<never> {
    if (typeof config !== 'object' || config === null) {
      return { success: false, errors: ['Config must be an object'] };
    }
    return { success: true } as ValidationResult<never>;
  }

  private validateRequiredFields(
    configObj: Record<string, unknown>,
  ): ValidationResult<never> {
    if (typeof configObj.pattern !== 'string') {
      return { success: false, errors: ['pattern must be a string'] };
    }
    if (typeof configObj.replacement !== 'string') {
      return { success: false, errors: ['replacement must be a string'] };
    }
    return { success: true } as ValidationResult<never>;
  }

  private validateRegexPattern(
    pattern: string,
    flags?: string,
  ): ValidationResult<never> {
    try {
      new RegExp(pattern, flags);
      return { success: true } as ValidationResult<never>;
    } catch (error) {
      return {
        success: false,
        errors: [
          `Invalid regex pattern: ${error instanceof Error ? error.message : String(error)}`,
        ],
      };
    }
  }

  private buildValidConfig(
    configObj: Record<string, unknown>,
  ): ValidationResult<RegexReplaceConfig> {
    const regexConfig: RegexReplaceConfig = {
      pattern: configObj.pattern as string,
      replacement: configObj.replacement as string,
      flags: typeof configObj.flags === 'string' ? configObj.flags : 'g',
    };
    return { success: true, data: regexConfig };
  }

  private buildValidationError(
    error: unknown,
  ): ValidationResult<RegexReplaceConfig> {
    return {
      success: false,
      errors: [
        `Config validation failed: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
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
        return this.buildNonStringResult(data, context.rowNumber);
      }

      const { result, matchCount } = this.applyRegexReplace(data, config);
      return this.buildSuccessResult(data, result, matchCount, config.pattern);
    } catch (error) {
      return this.buildErrorResult(data, error);
    }
  }

  private buildNonStringResult(
    data: unknown,
    rowNumber: number,
  ): ProcessingResult {
    return {
      success: true,
      data: data,
      warnings: [
        `Row ${rowNumber}: Regex replace processor received non-string data, skipping`,
      ],
    };
  }

  private applyRegexReplace(
    data: string,
    config: RegexReplaceConfig,
  ): { result: string; matchCount: number } {
    const regex = new RegExp(config.pattern, config.flags);
    const matchCount = (data.match(regex) || []).length;
    const result = data.replace(regex, config.replacement);
    return { result, matchCount };
  }

  private buildSuccessResult(
    originalData: string,
    result: string,
    matchCount: number,
    pattern: string,
  ): ProcessingResult {
    return {
      success: true,
      data: result,
      metadata: {
        originalValue: originalData,
        replacedValue: result,
        matchCount,
        pattern,
        operation: 'regex-replace',
      },
    };
  }

  private buildErrorResult(data: unknown, error: unknown): ProcessingResult {
    return {
      success: false,
      data: data,
      errors: [
        `Regex replace processing failed: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }
}
