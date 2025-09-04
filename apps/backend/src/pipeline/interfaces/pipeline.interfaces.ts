// Core interfaces for the pipeline - designed for extensibility

export interface RawDataRow {
  [key: string]: string | number | boolean | null;
}

export interface ParsedDataRow {
  raw: RawDataRow;
  transformed?: RawDataRow;
  errors: ValidationError[];
  rowNumber: number;
}

export interface ValidationError {
  field: string;
  value: unknown;
  error: string;
  severity: 'error' | 'warning';
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  processedRows: number;
  errorRows: number;
  errors: ValidationError[];
  data?: ParsedDataRow[];
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: (value: unknown) => unknown;
  required?: boolean;
}

// For future phases - orchestrator pattern
export interface ProcessingStage {
  name: string;
  order: number;
  execute(data: ParsedDataRow[]): Promise<ParsedDataRow[]>;
}

// For future phases - cleaning rules
export interface CleaningRule {
  id: string;
  field: string;
  type:
    | 'trim'
    | 'regex_replace'
    | 'exact_match'
    | 'fuzzy_match'
    | 'required_field'
    | 'data_type_check';
  pattern?: string;
  replacement?: string;
  priority: number;
}
