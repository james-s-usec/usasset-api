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
    try {
      if (typeof config !== 'object' || config === null) {
        return {
          success: false,
          errors: ['Config must be an object'],
        };
      }

      const configObj = config as Record<string, unknown>;

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
    try {
      if (typeof data !== 'string') {
        return {
          success: true,
          data: data,
          warnings: [
            `Row ${context.rowNumber}: Special char remover received non-string data, skipping`,
          ],
        };
      }

      // Build regex pattern for characters to keep
      let keepPattern = 'a-zA-Z0-9'; // Always keep alphanumeric

      if (config.preserveSpaces) {
        keepPattern += '\\s';
      }

      if (config.keepChars) {
        // Escape special regex characters in keepChars
        const escaped = config.keepChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        keepPattern += escaped;
      }

      const regex = new RegExp(`[^${keepPattern}]`, 'g');
      const result = data.replace(regex, config.replaceWith || '');

      const charsRemoved =
        data.length -
        result.length +
        (config.replaceWith ? result.split(config.replaceWith).length - 1 : 0);

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
}
