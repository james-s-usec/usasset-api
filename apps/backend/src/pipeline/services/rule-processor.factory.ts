import { Injectable } from '@nestjs/common';
import { RuleType } from '@prisma/client';
import { RuleProcessor } from '../interfaces/rule-processor.interface';
import { TrimProcessor } from '../processors/clean/trim.processor';

@Injectable()
export class RuleProcessorFactory {
  private processors = new Map<RuleType, RuleProcessor>();

  public constructor() {
    // Register implemented processors
    this.registerProcessor(new TrimProcessor());
    // this.registerProcessor(new RequiredFieldProcessor());
    // this.registerProcessor(new FieldMappingProcessor());
  }

  public createProcessor(type: RuleType): RuleProcessor | null {
    return this.processors.get(type) || null;
  }

  private registerProcessor(processor: RuleProcessor): void {
    this.processors.set(processor.type, processor);
  }

  public registerProcessorInstance(processor: RuleProcessor): void {
    this.registerProcessor(processor);
  }

  public getSupportedTypes(): RuleType[] {
    return Array.from(this.processors.keys());
  }
}
