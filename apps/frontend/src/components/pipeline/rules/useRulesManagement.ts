import { useState, useCallback } from 'react';
import type { 
  PipelineRule, 
  ImportJob, 
  RulesTestResult, 
  NewRuleData, 
  ApiResponse 
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const extractTestResultFromData = (data: unknown): RulesTestResult => {
  const allRulesApplied: Array<{
    name: string;
    type: string;
    phase: string;
    target: string;
  }> = [];
  
  const phases = (data as { data?: { data?: { phases?: unknown[] } } })?.data?.data?.phases;
  if (Array.isArray(phases)) {
    phases.forEach((phase) => {
      const phaseData = phase as { phase: string; debug?: { rulesApplied?: string[] } };
      if (phaseData.debug?.rulesApplied) {
        phaseData.debug.rulesApplied.forEach((ruleName: string) => {
          allRulesApplied.push({
            name: ruleName,
            type: 'Unknown',
            phase: phaseData.phase,
            target: 'Multiple',
          });
        });
      }
    });
  }

  const firstPhase = Array.isArray(phases) ? phases[0] : null;
  const lastPhase = Array.isArray(phases) ? phases[phases.length - 1] : null;

  return {
    success: true,
    testData: {
      before: ((firstPhase as { data?: { rows?: unknown[] } })?.data?.rows?.[0] || {}) as Record<string, unknown>,
      after: ((lastPhase as { data?: { mappedRows?: unknown[]; rows?: unknown[] } })?.data?.mappedRows?.[0] || 
             (lastPhase as { data?: { rows?: unknown[] } })?.data?.rows?.[0] || {}) as Record<string, unknown>,
    },
    rulesApplied: allRulesApplied,
    processing: {
      errors: [],
      warnings: [],
    },
  };
};

const performSaveRule = async (
  ruleData: NewRuleData, 
  editingRule: PipelineRule | null
): Promise<{ success: boolean; error: string }> => {
  const url = editingRule 
    ? `${API_BASE_URL}/api/pipeline/rules/${editingRule.id}`
    : `${API_BASE_URL}/api/pipeline/rules`;
  
  const method = editingRule ? 'PATCH' : 'POST';
  
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: ruleData.name.trim(),
      phase: ruleData.phase,
      type: ruleData.type,
      target: ruleData.target.trim(),
      config: JSON.parse(ruleData.config),
      priority: ruleData.priority,
      is_active: ruleData.is_active
    })
  });
  
  const data = await response.json() as ApiResponse<unknown>;
  
  if (data.success) {
    return { success: true, error: '' };
  } else {
    const action = editingRule ? 'update' : 'create';
    return { success: false, error: data.error?.message || `Failed to ${action} rule` };
  }
};

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

const useRulesState = (): {
  rules: PipelineRule[];
  jobs: ImportJob[];
  loading: boolean;
  error: string | null;
  testResult: RulesTestResult | null;
  setRules: (rules: PipelineRule[]) => void;
  setJobs: (jobs: ImportJob[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTestResult: (result: RulesTestResult | null) => void;
} => {
  const [rules, setRules] = useState<PipelineRule[]>([]);
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<RulesTestResult | null>(null);
  
  return { rules, jobs, loading, error, testResult, setRules, setJobs, setLoading, setError, setTestResult };
};

export const useRulesManagement = (): UseRulesManagementReturn => {
  const state = useRulesState();

  const loadRules = useCallback(async (): Promise<void> => {
    state.setLoading(true);
    state.setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/pipeline/rules`);
      const data: ApiResponse<{ rules: PipelineRule[] }> = await response.json();
      if (data.success) {
        state.setRules(data.data.rules || []);
      } else {
        throw new Error(data.error?.message || 'Failed to load rules');
      }
    } catch (err) {
      state.setError('Failed to load rules');
      console.error('Error loading rules:', err);
    } finally {
      state.setLoading(false);
    }
  }, [state]);

  const loadJobs = useCallback(async (): Promise<void> => {
    state.setLoading(true);
    state.setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/pipeline/jobs`);
      const data: ApiResponse<{ jobs: ImportJob[] }> = await response.json();
      if (data.success) {
        state.setJobs(data.data.jobs || []);
      } else {
        throw new Error(data.error?.message || 'Failed to load jobs');
      }
    } catch (err) {
      state.setError('Failed to load jobs');
      console.error('Error loading jobs:', err);
    } finally {
      state.setLoading(false);
    }
  }, [state]);

  const testRules = useCallback(async (): Promise<void> => {
    state.setLoading(true);
    state.setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/pipeline/test-orchestrator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        const testResult = extractTestResultFromData(data);
        state.setTestResult(testResult);
      } else {
        state.setError('Orchestrator test failed');
      }
    } catch (err) {
      state.setError('Failed to test orchestrator');
      console.error('Error testing orchestrator:', err);
    } finally {
      state.setLoading(false);
    }
  }, [state]);

  const testOrchestrator = useCallback(async (): Promise<void> => {
    state.setLoading(true);
    state.setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/pipeline/test-orchestrator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        console.log('Orchestrator test results:', data.data);
        state.setError(null);
        const message = `Orchestrator test completed! ${data.data.data.summary.phasesCompleted} phases executed successfully in ${data.data.data.totalDuration}ms`;
        alert(message);
      } else {
        state.setError('Orchestrator test failed');
      }
    } catch {
      state.setError('Failed to test orchestrator');
    } finally {
      state.setLoading(false);
    }
  }, [state]);

  const saveRule = useCallback(async (
    ruleData: NewRuleData, 
    editingRule: PipelineRule | null
  ): Promise<boolean> => {
    state.setLoading(true);
    state.setError(null);
    try {
      const result = await performSaveRule(ruleData, editingRule);
      if (result.success) {
        await loadRules();
        return true;
      } else {
        state.setError(result.error);
        return false;
      }
    } catch (err) {
      state.setError('Failed to save rule');
      console.error('Error saving rule:', err);
      return false;
    } finally {
      state.setLoading(false);
    }
  }, [state, loadRules]);

  const deleteRule = useCallback(async (ruleId: string): Promise<boolean> => {
    if (!confirm('Are you sure you want to delete this rule?')) return false;
    
    state.setLoading(true);
    state.setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/pipeline/rules/${ruleId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadRules(); // Refresh the rules list
        return true;
      } else {
        state.setError(data.error?.message || 'Failed to delete rule');
        return false;
      }
    } catch (err) {
      state.setError('Failed to delete rule');
      console.error('Error deleting rule:', err);
      return false;
    } finally {
      state.setLoading(false);
    }
  }, [state, loadRules]);

  const clearError = useCallback((): void => {
    state.setError(null);
  }, [state]);

  const clearTestResult = useCallback((): void => {
    state.setTestResult(null);
  }, [state]);

  return {
    // State
    rules: state.rules,
    jobs: state.jobs,
    loading: state.loading,
    error: state.error,
    testResult: state.testResult,
    
    // Actions
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