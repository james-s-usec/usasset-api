import { Injectable } from '@nestjs/common';
import { RuleType } from '@prisma/client';
import { RuleProcessor } from '../interfaces/rule-processor.interface';
import { TrimProcessor } from '../processors/clean/trim.processor';
import { RegexReplaceProcessor } from '../processors/clean/regex-replace.processor';
import { ExactReplaceProcessor } from '../processors/clean/exact-replace.processor';
import { RemoveDuplicatesProcessor } from '../processors/clean/remove-duplicates.processor';
import { UppercaseProcessor } from '../processors/transform/uppercase.processor';

@Injectable()
export class RuleProcessorFactory {
  private processors = new Map<RuleType, RuleProcessor>();

  public constructor() {
    // Register implemented processors
    this.registerProcessor(new TrimProcessor());
    this.registerProcessor(new RegexReplaceProcessor());
    this.registerProcessor(new ExactReplaceProcessor());
    this.registerProcessor(new RemoveDuplicatesProcessor());
    this.registerProcessor(new UppercaseProcessor());

    // Special char remover uses REGEX_REPLACE type but with special config
    // We'll need to handle this differently or create a separate rule type
    // this.registerProcessor(new SpecialCharRemoverProcessor());
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
