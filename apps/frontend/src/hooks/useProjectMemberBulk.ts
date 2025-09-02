import { useCallback } from 'react';
import { projectApi } from '../services/project-api';
import { DebugService } from '../services/debug-logger';
import type { ApiError } from '../types/error.types';
import type { BulkAssignUsersDto } from '../types/project.types';
import type { UseProjectMemberStateReturn } from './useProjectMemberState';
import type { UseProjectMembersListReturn } from './useProjectMembersList';

interface UseProjectMemberBulkReturn {
  bulkAssignUsers: (projectId: string, data: BulkAssignUsersDto) => Promise<number | undefined>;
}

export const useProjectMemberBulk = (
  state: UseProjectMemberStateReturn,
  list: UseProjectMembersListReturn
): UseProjectMemberBulkReturn => {
  const bulkAssignUsers = useCallback(async (
    projectId: string, 
    data: BulkAssignUsersDto
  ): Promise<number | undefined> => {
    try {
      state.setError(null);
      const result = await projectApi.bulkAssignUsers(projectId, data);
      
      if (state.currentProjectId === projectId) {
        await list.fetchMembers(projectId);
      }
      
      return result.count;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk assign users';
      state.setError(errorMessage);
      DebugService.logError('Failed to bulk assign users', err as ApiError);
      return undefined;
    }
  }, [state, list]);

  return { bulkAssignUsers };
};