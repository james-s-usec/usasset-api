export interface PipelineRule {
  id: string;
  name: string;
  description?: string;
  phase: string;
  type: string;
  target: string;
  config: Record<string, unknown>;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RulesTestResult {
  success: boolean;
  testData: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
  rulesApplied: Array<{
    name: string;
    type: string;
    phase: string;
    target: string;
  }>;
  processing: {
    errors: string[];
    warnings: string[];
  };
}

export interface ImportJob {
  id: string;
  file_id: string;
  status: string;
  total_rows: number | null;
  processed_rows: number | null;
  error_rows: number | null;
  errors: string[] | null;
  started_at: string;
  completed_at: string | null;
  created_by: string | null;
}

export interface NewRuleData {
  name: string;
  phase: string;
  type: string;
  target: string;
  config: string;
  priority: number;
  is_active: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
  };
}

export const PHASES = ['EXTRACT', 'VALIDATE', 'CLEAN', 'TRANSFORM', 'MAP', 'LOAD'] as const;

export const RULE_TYPES = {
  EXTRACT: ['ENCODING_DETECTOR', 'COLUMN_MAPPER', 'DELIMITER_DETECTOR', 'HEADER_VALIDATOR'],
  VALIDATE: ['REQUIRED_FIELD', 'DATA_TYPE_CHECK', 'RANGE_VALIDATOR', 'FORMAT_VALIDATOR'],
  CLEAN: ['TRIM', 'REGEX_REPLACE', 'EXACT_REPLACE', 'REMOVE_DUPLICATES'],
  TRANSFORM: ['TO_UPPERCASE', 'TO_LOWERCASE', 'TITLE_CASE', 'DATE_FORMAT', 'NUMERIC_FORMAT', 'CALCULATE_FIELD'],
  MAP: ['FIELD_MAPPING', 'ENUM_MAPPING', 'REFERENCE_LOOKUP', 'DEFAULT_VALUE'],
  LOAD: ['CONFLICT_RESOLUTION', 'BATCH_SIZE', 'TRANSACTION_BOUNDARY', 'ROLLBACK_STRATEGY']
} as const;

export type Phase = typeof PHASES[number];
export type RuleType = typeof RULE_TYPES[keyof typeof RULE_TYPES][number];