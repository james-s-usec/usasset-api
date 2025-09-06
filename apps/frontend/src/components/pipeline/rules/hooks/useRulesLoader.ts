import { useCallback } from 'react';
import type { PipelineRule, ImportJob } from '../types';
import { apiService } from '../../../../services/api';

interface RulesState {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRules: (rules: PipelineRule[]) => void;
  setJobs: (jobs: ImportJob[]) => void;
}

// Wrapper to handle loading state
const withLoadingState = async (
  state: RulesState,
  operation: () => Promise<void>
): Promise<void> => {
  state.setLoading(true);
  state.setError(null);
  try {
    await operation();
  } finally {
    state.setLoading(false);
  }
};

// Load rules handler
const createRulesLoader = (state: RulesState) => async (): Promise<void> => {
  await withLoadingState(state, async () => {
    try {
      const response = await apiService.get<{ success: boolean; data: { rules: PipelineRule[] } }>('/api/pipeline/rules');
      state.setRules(response.data?.rules || []);
    } catch (err) {
      state.setError('Failed to load rules');
      const { DebugLogger } = await import('../../../../services/debug-logger');
      DebugLogger.logError('Pipeline API: Load rules failed', err, {
        endpoint: '/api/pipeline/rules',
        method: 'GET',
        context: 'useRulesLoader.createRulesLoader'
      });
    }
  });
};

// Load jobs handler
const createJobsLoader = (state: RulesState) => async (): Promise<void> => {
  await withLoadingState(state, async () => {
    try {
      const response = await apiService.get<{ success: boolean; data: { jobs: ImportJob[] } }>('/api/pipeline/jobs');
      state.setJobs(response.data?.jobs || []);
    } catch (err) {
      state.setError('Failed to load jobs');
      const { DebugLogger } = await import('../../../../services/debug-logger');
      DebugLogger.logError('Pipeline API: Load jobs failed', err, {
        endpoint: '/api/pipeline/jobs',
        method: 'GET',
        context: 'useRulesLoader.createJobsLoader'
      });
    }
  });
};

export const useRulesLoader = (state: RulesState): { 
  loadRules: () => Promise<void>; 
  loadJobs: () => Promise<void> 
} => {
  const loadRules = useCallback(() => createRulesLoader(state)(), [state]);
  const loadJobs = useCallback(() => createJobsLoader(state)(), [state]);

  return { loadRules, loadJobs };
};