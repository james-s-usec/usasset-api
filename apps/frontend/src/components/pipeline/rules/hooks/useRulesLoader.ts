import { useCallback } from 'react';
import type { PipelineRule, ImportJob, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface RulesState {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRules: (rules: PipelineRule[]) => void;
  setJobs: (jobs: ImportJob[]) => void;
}

// Generic fetch helper to reduce duplication
const fetchData = async <T>(
  url: string,
  errorMessage: string
): Promise<T> => {
  const response = await fetch(url);
  const data: ApiResponse<T> = await response.json();
  if (!data.success) {
    throw new Error(data.error?.message || errorMessage);
  }
  return data.data;
};

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
      const data = await fetchData<{ rules: PipelineRule[] }>(
        `${API_BASE_URL}/api/pipeline/rules`,
        'Failed to load rules'
      );
      state.setRules(data.rules || []);
    } catch (err) {
      state.setError('Failed to load rules');
      console.error('Error loading rules:', err);
    }
  });
};

// Load jobs handler
const createJobsLoader = (state: RulesState) => async (): Promise<void> => {
  await withLoadingState(state, async () => {
    try {
      const data = await fetchData<{ jobs: ImportJob[] }>(
        `${API_BASE_URL}/api/pipeline/jobs`,
        'Failed to load jobs'
      );
      state.setJobs(data.jobs || []);
    } catch (err) {
      state.setError('Failed to load jobs');
      console.error('Error loading jobs:', err);
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