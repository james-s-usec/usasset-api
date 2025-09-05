export interface PhaseResultDto {
  phase: string;
  status: string;
  transformations: unknown;
  appliedRules: string[];
  inputSample: unknown;
  outputSample: unknown;
  metrics: PhaseResultMetricsDto;
  timing: PhaseResultTimingDto;
  metadata: unknown;
  errors: unknown;
  warnings: unknown;
}

export interface PhaseResultMetricsDto {
  rowsProcessed: number;
  rowsModified: number;
  rowsFailed: number;
}

export interface PhaseResultTimingDto {
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;
}

export interface PhaseResultsSummaryDto {
  totalPhases: number;
  successfulPhases: number;
  failedPhases: number;
  totalDuration: number | null;
}

export interface GetPhaseResultsResponseDto {
  jobId: string;
  phaseResults: PhaseResultDto[];
  summary: PhaseResultsSummaryDto;
}

export interface PhaseResultRecordDto {
  id: string;
  phase: string;
  status: string;
  transformations: unknown;
  applied_rules: string[];
  input_sample: unknown;
  output_sample: unknown;
  rows_processed: number;
  rows_modified: number;
  rows_failed: number;
  metadata: unknown;
  errors: unknown;
  warnings: unknown;
  started_at: Date;
  completed_at: Date | null;
  duration_ms: number | null;
}
