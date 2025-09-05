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
    try {
      if (typeof config !== 'object' || config === null) {
        return {
          success: false,
          errors: ['Config must be an object'],
        };
      }

      const configObj = config as Record<string, unknown>;

      if (typeof configObj.delimiter !== 'string') {
        return {
          success: false,
          errors: ['delimiter must be a string'],
        };
      }

      const duplicatesConfig: RemoveDuplicatesConfig = {
        delimiter: configObj.delimiter,
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
    try {
      if (typeof data !== 'string') {
        return {
          success: true,
          data: data,
          warnings: [
            `Row ${context.rowNumber}: Remove duplicates processor received non-string data, skipping`,
          ],
        };
      }

      const items = data.split(config.delimiter).map((item) => item.trim());
      const originalCount = items.length;

      let uniqueItems: string[];
      if (config.caseSensitive) {
        uniqueItems = [...new Set(items)];
      } else {
        const seen = new Map<string, string>();
        for (const item of items) {
          const key = item.toLowerCase();
          if (!seen.has(key)) {
            seen.set(key, item);
          }
        }
        uniqueItems = Array.from(seen.values());
      }

      const result = uniqueItems.join(config.delimiter);
      const duplicatesRemoved = originalCount - uniqueItems.length;

      return {
        success: true,
        data: result,
        metadata: {
          originalValue: data,
          processedValue: result,
          originalCount,
          uniqueCount: uniqueItems.length,
          duplicatesRemoved,
          operation: 'remove-duplicates',
        },
      };
    } catch (error) {
      return {
        success: false,
        data: data,
        errors: [
          `Remove duplicates processing failed: ${error instanceof Error ? error.message : String(error)}`,
        ],
      };
    }
  }
}
