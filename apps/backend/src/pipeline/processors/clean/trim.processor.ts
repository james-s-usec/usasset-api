import { Injectable } from '@nestjs/common';
import { RuleType, PipelinePhase } from '@prisma/client';
import {
  RuleProcessor,
  ValidationResult,
  ProcessingResult,
  ProcessingContext,
} from '../../interfaces/rule-processor.interface';

export interface TrimConfig {
  sides: 'both' | 'left' | 'right';
  customChars: string;
}

@Injectable()
export class TrimProcessor implements RuleProcessor<TrimConfig> {
  public readonly type = RuleType.TRIM;
  public readonly phase = PipelinePhase.CLEAN;

  public validateConfig(
    config: unknown,
  ): Promise<ValidationResult<TrimConfig>> {
    return Promise.resolve(this.performValidation(config));
  }

  private performValidation(config: unknown): ValidationResult<TrimConfig> {
    try {
      const objectValidation = this.validateIsObject(config);
      if (!objectValidation.success) {
        return objectValidation;
      }

      const trimConfig = this.extractConfig(config);
      const validationResult = this.validateTrimConfig(trimConfig);

      if (!validationResult.success) {
        return validationResult;
      }

      return { success: true, data: trimConfig };
    } catch (error) {
      return this.createErrorResult(error);
    }
  }

  private validateIsObject(config: unknown): ValidationResult<TrimConfig> {
    if (typeof config !== 'object' || config === null) {
      return {
        success: false,
        errors: ['Config must be an object'],
      };
    }
    return { success: true, data: {} as TrimConfig };
  }

  private extractConfig(config: unknown): TrimConfig {
    const configObj = config as Record<string, unknown>;
    return {
      sides: this.extractSides(configObj),
      customChars: this.extractCustomChars(configObj),
    };
  }

  private extractSides(
    configObj: Record<string, unknown>,
  ): 'both' | 'left' | 'right' {
    const sides = configObj.sides as string;
    if (sides === 'left' || sides === 'right') {
      return sides;
    }
    return 'both';
  }

  private extractCustomChars(configObj: Record<string, unknown>): string {
    const chars = configObj.customChars;
    if (typeof chars === 'string') {
      return chars;
    }
    return ' \t\n\r';
  }

  private validateTrimConfig(
    trimConfig: TrimConfig,
  ): ValidationResult<TrimConfig> {
    if (!['both', 'left', 'right'].includes(trimConfig.sides)) {
      return {
        success: false,
        errors: ['sides must be "both", "left", or "right"'],
      };
    }

    if (typeof trimConfig.customChars !== 'string') {
      return {
        success: false,
        errors: ['customChars must be a string'],
      };
    }

    return { success: true, data: trimConfig };
  }

  private createErrorResult(error: unknown): ValidationResult<TrimConfig> {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      errors: [`Config validation failed: ${message}`],
    };
  }

  public process(
    data: unknown,
    config: TrimConfig,
    context: ProcessingContext,
  ): Promise<ProcessingResult> {
    return Promise.resolve(this.performProcessing(data, config, context));
  }

  private performProcessing(
    data: unknown,
    config: TrimConfig,
    context: ProcessingContext,
  ): ProcessingResult {
    try {
      if (typeof data !== 'string') {
        return this.handleNonStringData(data, context);
      }

      const result = this.performTrim(data, config);
      return this.createSuccessResult(data, result, config);
    } catch (error) {
      return this.createProcessingError(data, error);
    }
  }

  private handleNonStringData(
    data: unknown,
    context: ProcessingContext,
  ): ProcessingResult {
    return {
      success: true,
      data: data,
      warnings: [
        `Row ${context.rowNumber}: Trim processor received non-string data, skipping`,
      ],
    };
  }

  private performTrim(data: string, config: TrimConfig): string {
    switch (config.sides) {
      case 'left':
        return this.trimLeft(data, config.customChars);
      case 'right':
        return this.trimRight(data, config.customChars);
      case 'both':
      default:
        return this.trimBoth(data, config.customChars);
    }
  }

  private createSuccessResult(
    original: string,
    result: string,
    config: TrimConfig,
  ): ProcessingResult {
    return {
      success: true,
      data: result,
      metadata: {
        originalLength: original.length,
        trimmedLength: result.length,
        charactersRemoved: original.length - result.length,
        operation: `trim-${config.sides}`,
      },
    };
  }

  private createProcessingError(
    data: unknown,
    error: unknown,
  ): ProcessingResult {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      data: data,
      errors: [`Trim processing failed: ${message}`],
    };
  }

  private trimLeft(str: string, chars: string): string {
    let start = 0;
    while (start < str.length && chars.includes(str[start])) {
      start++;
    }
    return str.substring(start);
  }

  private trimRight(str: string, chars: string): string {
    let end = str.length;
    while (end > 0 && chars.includes(str[end - 1])) {
      end--;
    }
    return str.substring(0, end);
  }

  private trimBoth(str: string, chars: string): string {
    return this.trimRight(this.trimLeft(str, chars), chars);
  }
}
