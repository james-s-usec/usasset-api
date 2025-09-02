import { useCallback } from 'react';
import { projectApi } from '../services/project-api';
import { DebugService } from '../services/debug-logger';
import type { ApiError } from '../types/error.types';
import type { UseProjectMemberStateReturn } from './useProjectMemberState';

export interface UseProjectMembersListReturn {
  fetchMembers: (projectId: string) => Promise<void>;
}

export const useProjectMembersList = (
  state: UseProjectMemberStateReturn
): UseProjectMembersListReturn => {
  const fetchMembers = useCallback(async (projectId: string): Promise<void> => {
    try {
      state.setLoading(true);
      state.setError(null);
      state.setCurrentProjectId(projectId);
      
      const projectMembers = await projectApi.getProjectMembers(projectId);
      state.setMembers(projectMembers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch project members';
      state.setError(errorMessage);
      DebugService.logError('Failed to fetch project members', err as ApiError);
    } finally {
      state.setLoading(false);
    }
  }, [state]);

  return { fetchMembers };
};