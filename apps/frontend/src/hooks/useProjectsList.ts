/**
 * Projects List Hook
 * Handles fetching projects with search parameters
 */

import { useCallback } from 'react';
import { projectApi } from '../services/project-api';
import { DebugService } from '../services/debug-logger';
import type { Project, ProjectSearchParams } from '../types/project.types';
import type { ApiError } from '../types/error.types';

interface UseProjectsListProps {
  setProjects: (projects: Project[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTotal: (total: number) => void;
  setLastParams: (params: ProjectSearchParams | undefined) => void;
  lastParams: ProjectSearchParams | undefined;
}

interface UseProjectsListReturn {
  fetchProjects: (params?: ProjectSearchParams) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

export function useProjectsList(props: UseProjectsListProps): UseProjectsListReturn {
  const { setProjects, setLoading, setError, setTotal, setLastParams, lastParams } = props;

  const fetchProjects = useCallback(async (params?: ProjectSearchParams) => {
    try {
      setLoading(true);
      setError(null);
      setLastParams(params);
      
      const response = await projectApi.getProjects(params);
      setProjects(response.data);
      setTotal(response.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects';
      setError(errorMessage);
      DebugService.logError('Failed to fetch projects', err as ApiError);
    } finally {
      setLoading(false);
    }
  }, [setProjects, setLoading, setError, setTotal, setLastParams]);

  const refreshProjects = useCallback(async () => {
    await fetchProjects(lastParams);
  }, [fetchProjects, lastParams]);

  return { fetchProjects, refreshProjects };
}