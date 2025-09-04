import { RuleType, PipelinePhase } from '@prisma/client';

export interface ValidationResult<TConfig = unknown> {
  success: boolean;
  data?: TConfig;
  errors?: string[];
}

export interface ProcessingContext {
  rowNumber: number;
  jobId: string;
  correlationId: string;
  metadata: Record<string, unknown>;
}

export interface ProcessingResult {
  success: boolean;
  data?: unknown;
  errors?: string[];
  warnings?: string[];
  metadata?: Record<string, unknown>;
}

export interface RuleProcessor<TConfig = unknown> {
  readonly type: RuleType;
  readonly phase: PipelinePhase;

  validateConfig(config: unknown): Promise<ValidationResult<TConfig>>;
  process(
    data: unknown,
    config: TConfig,
    context: ProcessingContext,
  ): Promise<ProcessingResult>;
}
