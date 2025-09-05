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
      const basicValidation = this.validateBasicConfigStructure(config);
      if (!basicValidation.success) {
        return basicValidation;
      }

      const configObj = config as Record<string, unknown>;
      const replacementsValidation = this.validateReplacementsArray(
        configObj.replacements,
      );
      if (!replacementsValidation.success) {
        return replacementsValidation;
      }

      const exactConfig = this.buildValidatedConfig(configObj);
      return { success: true, data: exactConfig };
    } catch (error) {
      return this.buildValidationErrorResult(error);
    }
  }

  private validateBasicConfigStructure(
    config: unknown,
  ): ValidationResult<never> {
    if (typeof config !== 'object' || config === null) {
      return {
        success: false,
        errors: ['Config must be an object'],
      };
    }
    return { success: true } as ValidationResult<never>;
  }

  private validateReplacementsArray(
    replacements: unknown,
  ): ValidationResult<never> {
    if (!Array.isArray(replacements)) {
      return {
        success: false,
        errors: ['replacements must be an array'],
      };
    }

    for (const replacement of replacements) {
      const validationResult = this.validateSingleReplacement(replacement);
      if (!validationResult.success) {
        return validationResult;
      }
    }

    return { success: true } as ValidationResult<never>;
  }

  private validateSingleReplacement(
    replacement: unknown,
  ): ValidationResult<never> {
    if (typeof replacement !== 'object' || replacement === null) {
      return {
        success: false,
        errors: ['Each replacement must be an object'],
      };
    }

    const replObj = replacement as Record<string, unknown>;
    if (typeof replObj.from !== 'string' || typeof replObj.to !== 'string') {
      return {
        success: false,
        errors: [
          'Each replacement must have "from" and "to" string properties',
        ],
      };
    }

    return { success: true } as ValidationResult<never>;
  }

  private buildValidatedConfig(
    configObj: Record<string, unknown>,
  ): ExactReplaceConfig {
    return {
      replacements: configObj.replacements as Array<{
        from: string;
        to: string;
      }>,
      caseSensitive:
        typeof configObj.caseSensitive === 'boolean'
          ? configObj.caseSensitive
          : true,
    };
  }

  private buildValidationErrorResult(
    error: unknown,
  ): ValidationResult<ExactReplaceConfig> {
    return {
      success: false,
      errors: [
        `Config validation failed: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
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
        return this.buildNonStringDataResult(data, context.rowNumber);
      }

      const { result, totalReplacements } = this.applyAllReplacements(
        data,
        config,
      );

      return this.buildSuccessResult(data, result, totalReplacements);
    } catch (error) {
      return this.buildProcessingErrorResult(data, error);
    }
  }

  private buildNonStringDataResult(
    data: unknown,
    rowNumber: number,
  ): ProcessingResult {
    return {
      success: true,
      data: data,
      warnings: [
        `Row ${rowNumber}: Exact replace processor received non-string data, skipping`,
      ],
    };
  }

  private applyAllReplacements(
    data: string,
    config: ExactReplaceConfig,
  ): { result: string; totalReplacements: number } {
    let result = data;
    let totalReplacements = 0;

    const sortedReplacements = this.getSortedReplacements(config.replacements);

    for (const replacement of sortedReplacements) {
      const { newResult, count } = this.applySingleReplacement(
        result,
        replacement,
        config.caseSensitive ?? true,
      );
      result = newResult;
      totalReplacements += count;
    }

    return { result, totalReplacements };
  }

  private getSortedReplacements(
    replacements: Array<{ from: string; to: string }>,
  ): Array<{ from: string; to: string }> {
    return [...replacements].sort((a, b) => b.from.length - a.from.length);
  }

  private applySingleReplacement(
    input: string,
    replacement: { from: string; to: string },
    caseSensitive: boolean,
  ): { newResult: string; count: number } {
    if (caseSensitive) {
      return this.applyCaseSensitiveReplacement(input, replacement);
    } else {
      return this.applyCaseInsensitiveReplacement(input, replacement);
    }
  }

  private applyCaseSensitiveReplacement(
    input: string,
    replacement: { from: string; to: string },
  ): { newResult: string; count: number } {
    const count = (
      input.match(
        new RegExp(
          replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          'g',
        ),
      ) || []
    ).length;
    const newResult = input.split(replacement.from).join(replacement.to);
    return { newResult, count };
  }

  private applyCaseInsensitiveReplacement(
    input: string,
    replacement: { from: string; to: string },
  ): { newResult: string; count: number } {
    const regex = new RegExp(
      replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'gi',
    );
    const count = (input.match(regex) || []).length;
    const newResult = input.replace(regex, replacement.to);
    return { newResult, count };
  }

  private buildSuccessResult(
    originalData: string,
    result: string,
    totalReplacements: number,
  ): ProcessingResult {
    return {
      success: true,
      data: result,
      metadata: {
        originalValue: originalData,
        replacedValue: result,
        replacementCount: totalReplacements,
        operation: 'exact-replace',
      },
    };
  }

  private buildProcessingErrorResult(
    data: unknown,
    error: unknown,
  ): ProcessingResult {
    return {
      success: false,
      data: data,
      errors: [
        `Exact replace processing failed: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }
}
