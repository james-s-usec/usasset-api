import { PipelinePhase } from '@prisma/client';

// Field name constants to avoid magic strings
export const FIELD_NAMES = {
  ASSET_TAG: 'Asset Tag',
  ASSET_NAME: 'Asset Name',
  STATUS: 'Status',
  CONDITION: 'Condition',
  MANUFACTURER: 'Manufacturer',
  MODEL: 'Model',
  SERIAL: 'Serial Number',
  BUILDING: 'Building',
  FLOOR: 'Floor',
  ROOM: 'Room',
  PURCHASE_DATE: 'Purchase Date',
  PURCHASE_COST: 'Purchase Cost',
} as const;

// Typed row data
export interface AssetRowData {
  [FIELD_NAMES.ASSET_TAG]?: string;
  [FIELD_NAMES.ASSET_NAME]?: string;
  [FIELD_NAMES.STATUS]?: string;
  [FIELD_NAMES.CONDITION]?: string;
  [FIELD_NAMES.MANUFACTURER]?: string;
  [FIELD_NAMES.MODEL]?: string;
  [FIELD_NAMES.SERIAL]?: string;
  [FIELD_NAMES.BUILDING]?: string;
  [FIELD_NAMES.FLOOR]?: string;
  [FIELD_NAMES.ROOM]?: string;
  [FIELD_NAMES.PURCHASE_DATE]?: string;
  [FIELD_NAMES.PURCHASE_COST]?: string;
  [key: string]: string | undefined;
}

// Phase data with proper typing
export interface PhaseInputData {
  rows?: AssetRowData[];
  validRows?: AssetRowData[];
  invalidRows?: AssetRowData[];
  cleanedRows?: AssetRowData[];
  transformedRows?: AssetRowData[];
  mappedRows?: AssetRowData[];
  validationResults?: Array<{
    row: number;
    errors: string[];
    warnings: string[];
  }>;
  fileId?: string;
  [key: string]: unknown;
}

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

  process(data: PhaseInputData, context: PhaseContext): Promise<PhaseResult>;
  validate?(data: PhaseInputData, context: PhaseContext): Promise<boolean>;
}
