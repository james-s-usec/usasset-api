import { useState, useCallback } from 'react';
import { projectApi } from '../services/project-api';
import type { 
  ProjectMember,
  AssignUserToProjectDto,
  BulkAssignUsersDto,
  ProjectRole
} from '../types/project.types';
import { useDebugState } from './useDebugState';
import { DebugService } from '../services/debug-logger';
import type { ApiError } from '../types/error.types';

interface UseProjectMembersReturn {
  members: ProjectMember[];
  loading: boolean;
  error: string | null;
  fetchMembers: (projectId: string) => Promise<void>;
  assignUser: (projectId: string, data: AssignUserToProjectDto) => Promise<ProjectMember | undefined>;
  bulkAssignUsers: (projectId: string, data: BulkAssignUsersDto) => Promise<number | undefined>;
  updateMemberRole: (projectId: string, userId: string, role: ProjectRole) => Promise<boolean>;
  removeMember: (projectId: string, userId: string) => Promise<boolean>;
}

export function useProjectMembers(): UseProjectMembersReturn {
  const [members, setMembers] = useDebugState<ProjectMember[]>([], { name: 'members', componentName: 'useProjectMembers' });
  const [loading, setLoading] = useDebugState(false, { name: 'loading', componentName: 'useProjectMembers' });
  const [error, setError] = useDebugState<string | null>(null, { name: 'error', componentName: 'useProjectMembers' });
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const fetchMembers = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentProjectId(projectId);
      
      const projectMembers = await projectApi.getProjectMembers(projectId);
      setMembers(projectMembers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch project members';
      setError(errorMessage);
      DebugService.logError('Failed to fetch project members', err as ApiError);
    } finally {
      setLoading(false);
    }
  }, [setMembers, setLoading, setError]);

  const assignUser = useCallback(async (
    projectId: string, 
    data: AssignUserToProjectDto
  ): Promise<ProjectMember | undefined> => {
    try {
      setError(null);
      const newMember = await projectApi.assignUserToProject(projectId, data);
      
      // Add the new member to the list if we're viewing the same project
      if (currentProjectId === projectId) {
        setMembers(prev => [...prev, newMember]);
      }
      
      return newMember;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign user to project';
      setError(errorMessage);
      DebugService.logError('Failed to assign user', err as ApiError);
      return undefined;
    }
  }, [currentProjectId, setMembers, setError]);

  const bulkAssignUsers = useCallback(async (
    projectId: string, 
    data: BulkAssignUsersDto
  ): Promise<number | undefined> => {
    try {
      setError(null);
      const result = await projectApi.bulkAssignUsers(projectId, data);
      
      // Refresh members if we're viewing the same project
      if (currentProjectId === projectId) {
        await fetchMembers(projectId);
      }
      
      return result.count;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk assign users';
      setError(errorMessage);
      DebugService.logError('Failed to bulk assign users', err as ApiError);
      return undefined;
    }
  }, [currentProjectId, fetchMembers, setError]);

  const updateMemberRole = useCallback(async (
    projectId: string, 
    userId: string, 
    role: ProjectRole
  ): Promise<boolean> => {
    try {
      setError(null);
      await projectApi.updateMemberRole(projectId, userId, { role });
      
      // Update the member role in local state
      if (currentProjectId === projectId) {
        setMembers(prev => prev.map(member => 
          member.user.id === userId ? { ...member, role } : member
        ));
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update member role';
      setError(errorMessage);
      DebugService.logError('Failed to update member role', err as ApiError);
      return false;
    }
  }, [currentProjectId, setMembers, setError]);

  const removeMember = useCallback(async (
    projectId: string, 
    userId: string
  ): Promise<boolean> => {
    try {
      setError(null);
      await projectApi.removeUserFromProject(projectId, userId);
      
      // Remove member from local state
      if (currentProjectId === projectId) {
        setMembers(prev => prev.filter(member => member.user.id !== userId));
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove member';
      setError(errorMessage);
      DebugService.logError('Failed to remove member', err as ApiError);
      return false;
    }
  }, [currentProjectId, setMembers, setError]);

  return {
    members,
    loading,
    error,
    fetchMembers,
    assignUser,
    bulkAssignUsers,
    updateMemberRole,
    removeMember,
  };
}