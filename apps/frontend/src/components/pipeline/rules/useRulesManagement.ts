import { useCallback } from 'react';
import type { 
  PipelineRule, 
  ImportJob, 
  RulesTestResult, 
  NewRuleData
} from './types';
import { useRulesState } from './hooks/useRulesState';
import { useRulesLoader } from './hooks/useRulesLoader';
import { useRulesTester } from './hooks/useRulesTester';
import { useRulesEditor } from './hooks/useRulesEditor';


interface UseRulesManagementReturn {
  rules: PipelineRule[];
  jobs: ImportJob[];
  loading: boolean;
  error: string | null;
  testResult: RulesTestResult | null;
  loadRules: () => Promise<void>;
  loadJobs: () => Promise<void>;
  testRules: () => Promise<void>;
  testOrchestrator: () => Promise<void>;
  saveRule: (ruleData: NewRuleData, editingRule: PipelineRule | null) => Promise<boolean>;
  deleteRule: (ruleId: string) => Promise<boolean>;
  clearError: () => void;
  clearTestResult: () => void;
}


export const useRulesManagement = (): UseRulesManagementReturn => {
  const state = useRulesState();
  const { loadRules, loadJobs } = useRulesLoader(state);
  const { testRules, testOrchestrator } = useRulesTester(state);
  const { saveRule, deleteRule } = useRulesEditor(state, loadRules);

  const clearError = useCallback((): void => {
    state.setError(null);
  }, [state]);

  const clearTestResult = useCallback((): void => {
    state.setTestResult(null);
  }, [state]);

  return {
    rules: state.rules,
    jobs: state.jobs,
    loading: state.loading,
    error: state.error,
    testResult: state.testResult,
    loadRules,
    loadJobs,
    testRules,
    testOrchestrator,
    saveRule,
    deleteRule,
    clearError,
    clearTestResult
  };
};