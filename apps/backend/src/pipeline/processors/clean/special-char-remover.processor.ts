import { Injectable } from '@nestjs/common';
import { RuleType, PipelinePhase } from '@prisma/client';
import {
  RuleProcessor,
  ValidationResult,
  ProcessingResult,
  ProcessingContext,
} from '../../interfaces/rule-processor.interface';

export interface SpecialCharRemoverConfig {
  keepChars?: string; // Characters to keep (e.g., ".-_")
  replaceWith?: string; // What to replace special chars with (default: "")
  preserveSpaces?: boolean; // Whether to keep spaces
}

@Injectable()
export class SpecialCharRemoverProcessor
  implements RuleProcessor<SpecialCharRemoverConfig>
{
  public readonly type = RuleType.REGEX_REPLACE; // Using REGEX_REPLACE type
  public readonly phase = PipelinePhase.CLEAN;

  public validateConfig(
    config: unknown,
  ): Promise<ValidationResult<SpecialCharRemoverConfig>> {
    return Promise.resolve(this.performValidation(config));
  }

  private performValidation(
    config: unknown,
  ): ValidationResult<SpecialCharRemoverConfig> {
    if (!this.isValidConfig(config)) {
      return {
        success: false,
        errors: ['Config must be an object'],
      };
    }
    return this.buildConfig(config);
  }

  private isValidConfig(config: unknown): config is Record<string, unknown> {
    return typeof config === 'object' && config !== null;
  }

  private buildConfig(
    configObj: Record<string, unknown>,
  ): ValidationResult<SpecialCharRemoverConfig> {
    try {
      const specialConfig: SpecialCharRemoverConfig = {
        keepChars:
          typeof configObj.keepChars === 'string' ? configObj.keepChars : '',
        replaceWith:
          typeof configObj.replaceWith === 'string'
            ? configObj.replaceWith
            : '',
        preserveSpaces:
          typeof configObj.preserveSpaces === 'boolean'
            ? configObj.preserveSpaces
            : true,
      };
      return { success: true, data: specialConfig };
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
    config: SpecialCharRemoverConfig,
    context: ProcessingContext,
  ): Promise<ProcessingResult> {
    return Promise.resolve(this.performProcessing(data, config, context));
  }

  private performProcessing(
    data: unknown,
    config: SpecialCharRemoverConfig,
    context: ProcessingContext,
  ): ProcessingResult {
    if (typeof data !== 'string') {
      return this.handleNonString(data, context);
    }
    return this.processString(data, config);
  }

  private handleNonString(
    data: unknown,
    context: ProcessingContext,
  ): ProcessingResult {
    return {
      success: true,
      data: data,
      warnings: [
        `Row ${context.rowNumber}: Special char remover received non-string data, skipping`,
      ],
    };
  }

  private processString(
    data: string,
    config: SpecialCharRemoverConfig,
  ): ProcessingResult {
    try {
      const keepPattern = this.buildKeepPattern(config);
      const regex = new RegExp(`[^${keepPattern}]`, 'g');
      const result = data.replace(regex, config.replaceWith || '');
      const charsRemoved = this.countRemovedChars(data, result, config);

      return {
        success: true,
        data: result,
        metadata: {
          originalValue: data,
          cleanedValue: result,
          charactersRemoved: charsRemoved,
          keepPattern,
          operation: 'special-char-remover',
        },
      };
    } catch (error) {
      return {
        success: false,
        data: data,
        errors: [
          `Special char removal failed: ${error instanceof Error ? error.message : String(error)}`,
        ],
      };
    }
  }

  private buildKeepPattern(config: SpecialCharRemoverConfig): string {
    let keepPattern = 'a-zA-Z0-9';
    if (config.preserveSpaces) {
      keepPattern += '\\s';
    }
    if (config.keepChars) {
      const escaped = config.keepChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      keepPattern += escaped;
    }
    return keepPattern;
  }

  private countRemovedChars(
    original: string,
    result: string,
    config: SpecialCharRemoverConfig,
  ): number {
    return (
      original.length -
      result.length +
      (config.replaceWith ? result.split(config.replaceWith).length - 1 : 0)
    );
  }
}
