import { Injectable } from '@nestjs/common';
import { RuleType, PipelinePhase } from '@prisma/client';
import { 
  RuleProcessor, 
  ValidationResult, 
  ProcessingResult, 
  ProcessingContext 
} from '../../interfaces/rule-processor.interface';

export interface TrimConfig {
  sides: 'both' | 'left' | 'right';
  customChars: string;
}

@Injectable()
export class TrimProcessor implements RuleProcessor<TrimConfig> {
  public readonly type = RuleType.TRIM;
  public readonly phase = PipelinePhase.CLEAN;

  public async validateConfig(config: unknown): Promise<ValidationResult<TrimConfig>> {
    try {
      // Basic validation - in production would use a schema validator like Joi
      if (typeof config !== 'object' || config === null) {
        return {
          success: false,
          errors: ['Config must be an object']
        };
      }

      const typedConfig = config as any;
      
      // Set defaults
      const trimConfig: TrimConfig = {
        sides: typedConfig.sides || 'both',
        customChars: typedConfig.customChars || ' \t\n\r'
      };

      // Validate sides
      if (!['both', 'left', 'right'].includes(trimConfig.sides)) {
        return {
          success: false,
          errors: ['sides must be "both", "left", or "right"']
        };
      }

      // Validate customChars
      if (typeof trimConfig.customChars !== 'string') {
        return {
          success: false,
          errors: ['customChars must be a string']
        };
      }

      return {
        success: true,
        data: trimConfig
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Config validation failed: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  public async process(data: any, config: TrimConfig, context: ProcessingContext): Promise<ProcessingResult> {
    try {
      if (typeof data !== 'string') {
        return {
          success: true,
          data: data, // Return unchanged for non-string data
          warnings: [`Row ${context.rowNumber}: Trim processor received non-string data, skipping`]
        };
      }

      let result = data;
      
      switch (config.sides) {
        case 'left':
          result = this.trimLeft(data, config.customChars);
          break;
        case 'right':
          result = this.trimRight(data, config.customChars);
          break;
        case 'both':
        default:
          result = this.trimBoth(data, config.customChars);
          break;
      }

      return {
        success: true,
        data: result,
        metadata: {
          originalLength: data.length,
          trimmedLength: result.length,
          charactersRemoved: data.length - result.length,
          operation: `trim-${config.sides}`
        }
      };
    } catch (error) {
      return {
        success: false,
        data: data,
        errors: [`Trim processing failed: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
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