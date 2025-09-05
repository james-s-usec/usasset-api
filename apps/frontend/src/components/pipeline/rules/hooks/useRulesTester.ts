import { useCallback } from 'react';
import type { RulesTestResult } from '../types';
import { extractTestResultFromData } from '../utils/testResultExtractor';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface RulesState {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTestResult: (testResult: RulesTestResult | null) => void;
}

export const useRulesTester = (state: RulesState): { testRules: () => Promise<void>; testOrchestrator: () => Promise<void> } => {
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
    await handleOrchestratorTest(state);
  }, [state]);

  return { testRules, testOrchestrator };
};

const handleOrchestratorTest = async (state: RulesState): Promise<void> => {
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
      const message = buildSuccessMessage(data);
      alert(message);
    } else {
      state.setError('Orchestrator test failed');
    }
  } catch {
    state.setError('Failed to test orchestrator');
  } finally {
    state.setLoading(false);
  }
};

const buildSuccessMessage = (data: { data: { data: { summary: { phasesCompleted: number }; totalDuration: number } } }): string => {
  const { summary, totalDuration } = data.data.data;
  return `Orchestrator test completed! ${summary.phasesCompleted} phases executed successfully in ${totalDuration}ms`;
};