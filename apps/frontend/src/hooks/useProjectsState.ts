/**
 * Projects State Hook
 * Manages projects array, loading/error state, and pagination
 */

import { useState } from 'react';
import { useDebugState, useDebugArrayState } from './useDebugState';
import type { Project, ProjectSearchParams } from '../types/project.types';

interface UseProjectsStateReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  total: number;
  lastParams: ProjectSearchParams | undefined;
  setProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTotal: (total: number | ((prev: number) => number)) => void;
  setLastParams: (params: ProjectSearchParams | undefined) => void;
  clearError: () => void;
}

export function useProjectsState(): UseProjectsStateReturn {
  const debugOpts = { componentName: 'useProjects' };
  
  const [projects, setProjects] = useDebugArrayState<Project>([], { ...debugOpts, name: 'projects' });
  const [loading, setLoading] = useDebugState(false, { ...debugOpts, name: 'loading' });
  const [error, setError] = useDebugState<string | null>(null, { ...debugOpts, name: 'error' });
  const [total, setTotal] = useDebugState(0, { ...debugOpts, name: 'total' });
  const [lastParams, setLastParams] = useState<ProjectSearchParams | undefined>();

  return {
    projects, loading, error, total, lastParams,
    setProjects, setLoading, setError, setTotal, setLastParams,
    clearError: () => setError(null)
  };
}