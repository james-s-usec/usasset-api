// Properly typed interfaces to replace all 'any' types

export interface CsvRow {
  [key: string]: string | number | boolean | null | undefined | Date | string[];
}

export interface ProcessedRow extends CsvRow {
  // Metadata fields are stored separately, not as index properties
  // to avoid TypeScript index signature conflicts
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validRows: ProcessedRow[];
  invalidRows: ProcessedRow[];
}

export interface TransformationResult {
  transformedRows: ProcessedRow[];
  errors: string[];
}

export interface MappingResult {
  mappedRows: ProcessedRow[];
  unmappedFields: string[];
}

export interface CleaningResult {
  cleanedRows: ProcessedRow[];
  modifiedCount: number;
}

export interface LoadResult {
  loadResults: Array<{
    success: boolean;
    assetTag?: string;
    error?: string;
  }>;
  successCount: number;
  failureCount: number;
}

export interface PhaseResult {
  rows?: ProcessedRow[];
  validRows?: ProcessedRow[];
  invalidRows?: ProcessedRow[];
  cleanedRows?: ProcessedRow[];
  transformedRows?: ProcessedRow[];
  mappedRows?: ProcessedRow[];
  loadResults?: LoadResult;
  validationResults?: ValidationResult;
  errors?: string[];
  warnings?: string[];
}

export interface RuleConfig {
  [key: string]: string | number | boolean | string[];
}

export interface ProcessingRule {
  id: string;
  name: string;
  type: string;
  phase: string;
  target: string;
  config: RuleConfig;
  is_active: boolean;
  priority: number;
}

export interface JobStatus {
  id: string;
  fileName: string;
  status: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  processedRows: number;
  errors: string[];
  created_at: Date;
  updated_at: Date;
}

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  created_at: Date;
}

export interface ImportJobResult {
  jobId: string;
  status: string;
  stats: {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
  };
  errors: string[];
}

// Type guards
export function isProcessedRow(row: unknown): row is ProcessedRow {
  return row !== null && typeof row === 'object';
}

export function isValidationResult(
  result: unknown,
): result is ValidationResult {
  if (!result || typeof result !== 'object') return false;
  const r = result as Record<string, unknown>;
  return (
    typeof r.isValid === 'boolean' &&
    Array.isArray(r.errors) &&
    Array.isArray(r.warnings)
  );
}
