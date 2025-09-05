import { Injectable } from '@nestjs/common';
import { RuleType, PipelinePhase } from '@prisma/client';
import {
  RuleProcessor,
  ValidationResult,
  ProcessingResult,
  ProcessingContext,
} from '../../interfaces/rule-processor.interface';

export interface UppercaseConfig {
  // No config needed for simple uppercase transformation
}

@Injectable()
export class UppercaseProcessor implements RuleProcessor<UppercaseConfig> {
  public readonly type = RuleType.TO_UPPERCASE;
  public readonly phase = PipelinePhase.TRANSFORM;

  public validateConfig(
    config: unknown,
  ): Promise<ValidationResult<UppercaseConfig>> {
    // No validation needed for uppercase
    return Promise.resolve({ success: true, data: {} });
  }

  public process(
    data: unknown,
    config: UppercaseConfig,
    context: ProcessingContext,
  ): Promise<ProcessingResult> {
    return Promise.resolve(this.performProcessing(data, context));
  }

  private performProcessing(
    data: unknown,
    context: ProcessingContext,
  ): ProcessingResult {
    try {
      if (typeof data !== 'string') {
        return {
          success: true,
          data: data,
          warnings: [
            `Row ${context.rowNumber}: Uppercase processor received non-string data, skipping`,
          ],
        };
      }

      const result = data.toUpperCase();

      return {
        success: true,
        data: result,
        metadata: {
          originalValue: data,
          transformedValue: result,
          operation: 'to-uppercase',
        },
      };
    } catch (error) {
      return {
        success: false,
        data: data,
        errors: [
          `Uppercase processing failed: ${error instanceof Error ? error.message : String(error)}`,
        ],
      };
    }
  }
}
