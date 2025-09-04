import { PipelinePhase } from '@prisma/client';

export interface PhaseContext {
  jobId: string;
  correlationId: string;
  fileId?: string;
  rowNumber?: number;
  metadata: Record<string, unknown>;
}

export interface PhaseResult {
  success: boolean;
  phase: PipelinePhase;
  data?: unknown;
  errors: string[];
  warnings: string[];
  metrics: {
    startTime: Date;
    endTime: Date;
    durationMs: number;
    recordsProcessed: number;
    recordsSuccess: number;
    recordsFailed: number;
  };
  debug?: {
    rulesApplied?: string[];
    transformations?: Array<{ field: string; before: unknown; after: unknown }>;
    validationResults?: unknown;
  };
}

export interface PhaseProcessor {
  readonly phase: PipelinePhase;
  readonly name: string;
  readonly description: string;

  process(data: unknown, context: PhaseContext): Promise<PhaseResult>;
  validate?(data: unknown, context: PhaseContext): Promise<boolean>;
}
