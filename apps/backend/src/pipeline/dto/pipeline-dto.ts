/**
 * DTOs for Pipeline Controller
 * Replaces all 'any' types with proper interfaces
 */

import { ProcessedRow } from '../interfaces/pipeline-types';

export interface TestRuleResult {
  success: boolean;
  testData: {
    before: ProcessedRow[];
    after: ProcessedRow[];
  };
  rulesApplied: RuleInfo[];
  processing: {
    errors: string[];
    warnings: string[];
  };
}

export interface RuleInfo {
  id: string;
  name: string;
  type: string;
  phase: string;
  target: string;
}

export interface RuleConfigDto {
  [key: string]: string | number | boolean | string[];
}

export interface RuleDto {
  id: string;
  name: string;
  type: string;
  phase: string;
  target: string;
  config: RuleConfigDto;
  is_active: boolean;
  priority: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateRuleDto {
  name: string;
  type: string;
  phase: string;
  target: string;
  config: RuleConfigDto;
  is_active?: boolean;
  priority?: number;
}

export interface UpdateRuleDto {
  name?: string;
  type?: string;
  phase?: string;
  target?: string;
  config?: RuleConfigDto;
  is_active?: boolean;
  priority?: number;
}

export interface OrchestratorTestResult {
  success: boolean;
  phases: {
    extract?: PhaseTestResult;
    validate?: PhaseTestResult;
    clean?: PhaseTestResult;
    transform?: PhaseTestResult;
    map?: PhaseTestResult;
    load?: PhaseTestResult;
  };
  summary: {
    totalRows: number;
    successfulRows: number;
    failedRows: number;
    errors: string[];
  };
}

export interface PhaseTestResult {
  phase: string;
  success: boolean;
  inputRows: number;
  outputRows: number;
  errors: string[];
  warnings: string[];
  duration: number;
}
