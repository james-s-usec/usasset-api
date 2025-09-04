import { RuleType, PipelinePhase } from '@prisma/client';

export interface ValidationResult<TConfig = any> {
  success: boolean;
  data?: TConfig;
  errors?: string[];
}

export interface ProcessingContext {
  rowNumber: number;
  jobId: string;
  correlationId: string;
  metadata: Record<string, any>;
}

export interface ProcessingResult {
  success: boolean;
  data?: any;
  errors?: string[];
  warnings?: string[];
  metadata?: Record<string, any>;
}

export interface RuleProcessor<TConfig = any> {
  readonly type: RuleType;
  readonly phase: PipelinePhase;
  
  validateConfig(config: unknown): Promise<ValidationResult<TConfig>>;
  process(data: any, config: TConfig, context: ProcessingContext): Promise<ProcessingResult>;
}