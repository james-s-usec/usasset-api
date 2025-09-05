import { Injectable } from '@nestjs/common';
import { RuleType, PipelinePhase } from '@prisma/client';
import {
  RuleProcessor,
  ValidationResult,
  ProcessingResult,
  ProcessingContext,
} from '../../interfaces/rule-processor.interface';

export interface RemoveDuplicatesConfig {
  delimiter: string;
  caseSensitive?: boolean;
}

@Injectable()
export class RemoveDuplicatesProcessor
  implements RuleProcessor<RemoveDuplicatesConfig>
{
  public readonly type = RuleType.REMOVE_DUPLICATES;
  public readonly phase = PipelinePhase.CLEAN;

  public validateConfig(
    config: unknown,
  ): Promise<ValidationResult<RemoveDuplicatesConfig>> {
    return Promise.resolve(this.performValidation(config));
  }

  private performValidation(
    config: unknown,
  ): ValidationResult<RemoveDuplicatesConfig> {
    if (!this.isValidConfig(config)) {
      return { success: false, errors: ['Config must be an object'] };
    }
    const validation = this.validateDelimiter(config);
    if (!validation.success) return validation;
    return this.buildConfig(config);
  }

  private isValidConfig(config: unknown): config is Record<string, unknown> {
    return typeof config === 'object' && config !== null;
  }

  private validateDelimiter(
    config: Record<string, unknown>,
  ): ValidationResult<never> {
    if (typeof config.delimiter !== 'string') {
      return { success: false, errors: ['delimiter must be a string'] };
    }
    return { success: true } as ValidationResult<never>;
  }

  private buildConfig(
    configObj: Record<string, unknown>,
  ): ValidationResult<RemoveDuplicatesConfig> {
    try {
      const duplicatesConfig: RemoveDuplicatesConfig = {
        delimiter: configObj.delimiter as string,
        caseSensitive:
          typeof configObj.caseSensitive === 'boolean'
            ? configObj.caseSensitive
            : false,
      };
      return { success: true, data: duplicatesConfig };
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
    config: RemoveDuplicatesConfig,
    context: ProcessingContext,
  ): Promise<ProcessingResult> {
    return Promise.resolve(this.performProcessing(data, config, context));
  }

  private performProcessing(
    data: unknown,
    config: RemoveDuplicatesConfig,
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
        `Row ${context.rowNumber}: Remove duplicates processor received non-string data, skipping`,
      ],
    };
  }

  private processString(
    data: string,
    config: RemoveDuplicatesConfig,
  ): ProcessingResult {
    try {
      const items = this.splitAndTrimItems(data, config.delimiter);
      const uniqueItems = this.getUniqueItems(items, config.caseSensitive);
      const result = uniqueItems.join(config.delimiter);

      return this.createSuccessResult(
        data,
        result,
        items.length,
        uniqueItems.length,
      );
    } catch (error) {
      return this.createErrorResult(data, error);
    }
  }

  private splitAndTrimItems(data: string, delimiter: string): string[] {
    return data.split(delimiter).map((item) => item.trim());
  }

  private createSuccessResult(
    originalValue: string,
    processedValue: string,
    originalCount: number,
    uniqueCount: number,
  ): ProcessingResult {
    return {
      success: true,
      data: processedValue,
      metadata: {
        originalValue,
        processedValue,
        duplicatesRemoved: originalCount - uniqueCount,
        originalCount,
        uniqueCount,
        operation: 'remove-duplicates',
      },
    };
  }

  private createErrorResult(data: string, error: unknown): ProcessingResult {
    return {
      success: false,
      data: data,
      errors: [
        `Remove duplicates processing failed: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }

  private getUniqueItems(items: string[], caseSensitive?: boolean): string[] {
    if (caseSensitive) {
      return [...new Set(items)];
    }
    const seen = new Map<string, string>();
    for (const item of items) {
      const key = item.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, item);
      }
    }
    return Array.from(seen.values());
  }
}
