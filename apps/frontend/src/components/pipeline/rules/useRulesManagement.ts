import { useState, useCallback } from 'react';
import type { 
  PipelineRule, 
  ImportJob, 
  RulesTestResult, 
  NewRuleData, 
  ApiResponse 
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useRulesManagement = () => {
  const [rules, setRules] = useState<PipelineRule[]>([]);
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<RulesTestResult | null>(null);

  const loadRules = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/pipeline/rules`);
      const data: ApiResponse<{ rules: PipelineRule[] }> = await response.json();
      if (data.success) {
        setRules(data.data.rules || []);
      } else {
        throw new Error(data.error?.message || 'Failed to load rules');
      }
    } catch (err) {
      setError('Failed to load rules');
      console.error('Error loading rules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadJobs = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/pipeline/jobs`);
      const data: ApiResponse<{ jobs: ImportJob[] }> = await response.json();
      if (data.success) {
        setJobs(data.data.jobs || []);
      } else {
        throw new Error(data.error?.message || 'Failed to load jobs');
      }
    } catch (err) {
      setError('Failed to load jobs');
      console.error('Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const testRules = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/pipeline/test-orchestrator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        // Extract rules from orchestrator phases
        const allRulesApplied: Array<{
          name: string;
          type: string;
          phase: string;
          target: string;
        }> = [];
        
        if (data.data?.data?.phases) {
          data.data.data.phases.forEach((phase: { 
            phase: string; 
            debug?: { rulesApplied?: string[] } 
          }) => {
            if (phase.debug?.rulesApplied) {
              phase.debug.rulesApplied.forEach((ruleName: string) => {
                allRulesApplied.push({
                  name: ruleName,
                  type: 'Unknown',
                  phase: phase.phase,
                  target: 'Multiple',
                });
              });
            }
          });
        }

        // Get before/after data from first and last phases
        const firstPhase = data.data?.data?.phases?.[0];
        const lastPhase = data.data?.data?.phases?.[data.data?.data?.phases?.length - 1];

        setTestResult({
          success: true,
          testData: {
            before: firstPhase?.data?.rows?.[0] || {},
            after: lastPhase?.data?.mappedRows?.[0] || lastPhase?.data?.rows?.[0] || {},
          },
          rulesApplied: allRulesApplied,
          processing: {
            errors: [],
            warnings: [],
          },
        });
      } else {
        setError('Orchestrator test failed');
      }
    } catch (err) {
      setError('Failed to test orchestrator');
      console.error('Error testing orchestrator:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const testOrchestrator = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/pipeline/test-orchestrator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        console.log('Orchestrator test results:', data.data);
        setError(null);
        const message = `Orchestrator test completed! ${data.data.data.summary.phasesCompleted} phases executed successfully in ${data.data.data.totalDuration}ms`;
        alert(message);
      } else {
        setError('Orchestrator test failed');
      }
    } catch (err) {
      setError('Failed to test orchestrator');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveRule = useCallback(async (
    ruleData: NewRuleData, 
    editingRule: PipelineRule | null
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
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
      
      const data = await response.json();
      
      if (data.success) {
        await loadRules(); // Refresh the rules list
        return true;
      } else {
        setError(data.error?.message || `Failed to ${editingRule ? 'update' : 'create'} rule`);
        return false;
      }
    } catch (err) {
      setError('Failed to save rule');
      console.error('Error saving rule:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadRules]);

  const deleteRule = useCallback(async (ruleId: string): Promise<boolean> => {
    if (!confirm('Are you sure you want to delete this rule?')) return false;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/pipeline/rules/${ruleId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadRules(); // Refresh the rules list
        return true;
      } else {
        setError(data.error?.message || 'Failed to delete rule');
        return false;
      }
    } catch (err) {
      setError('Failed to delete rule');
      console.error('Error deleting rule:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadRules]);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const clearTestResult = useCallback((): void => {
    setTestResult(null);
  }, []);

  return {
    // State
    rules,
    jobs,
    loading,
    error,
    testResult,
    
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