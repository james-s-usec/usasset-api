import { useCallback } from 'react';
import { projectApi } from '../services/project-api';
import { DebugService } from '../services/debug-logger';
import type { ApiError } from '../types/error.types';
import type { AssignUserToProjectDto, ProjectMember, ProjectRole } from '../types/project.types';
import type { UseProjectMemberStateReturn } from './useProjectMemberState';

const handleApiError = (error: unknown, message: string, state: UseProjectMemberStateReturn): void => {
  const errorMessage = error instanceof Error ? error.message : message;
  state.setError(errorMessage);
  DebugService.logError(message, error as ApiError);
};

interface UseProjectMemberCRUDReturn {
  assignUser: (projectId: string, data: AssignUserToProjectDto) => Promise<ProjectMember | undefined>;
  updateMemberRole: (projectId: string, userId: string, role: ProjectRole) => Promise<boolean>;
  removeMember: (projectId: string, userId: string) => Promise<boolean>;
}

// Helper function to create assignUser callback
const createAssignUserCallback = (state: UseProjectMemberStateReturn) => {
  return async (
    projectId: string, 
    data: AssignUserToProjectDto
  ): Promise<ProjectMember | undefined> => {
    try {
      state.setError(null);
      const newMember = await projectApi.assignUserToProject(projectId, data);
      
      if (state.currentProjectId === projectId) {
        state.setMembers((prev: ProjectMember[]) => [...prev, newMember]);
      }
      
      return newMember;
    } catch (err) {
      handleApiError(err, 'Failed to assign user', state);
      return undefined;
    }
  };
};

// Helper function to create updateMemberRole callback
const createUpdateMemberRoleCallback = (state: UseProjectMemberStateReturn) => {
  return async (
    projectId: string, 
    userId: string, 
    role: ProjectRole
  ): Promise<boolean> => {
    try {
      state.setError(null);
      await projectApi.updateMemberRole(projectId, userId, { role });
      
      if (state.currentProjectId === projectId) {
        state.setMembers((prev: ProjectMember[]) => prev.map((member: ProjectMember) => 
          member.user.id === userId ? { ...member, role } : member
        ));
      }
      
      return true;
    } catch (err) {
      handleApiError(err, 'Failed to update member role', state);
      return false;
    }
  };
};

// Helper function to create removeMember callback
const createRemoveMemberCallback = (state: UseProjectMemberStateReturn) => {
  return async (
    projectId: string, 
    userId: string
  ): Promise<boolean> => {
    try {
      state.setError(null);
      await projectApi.removeUserFromProject(projectId, userId);
      
      if (state.currentProjectId === projectId) {
        state.setMembers((prev: ProjectMember[]) => 
          prev.filter((member: ProjectMember) => member.user.id !== userId)
        );
      }
      
      return true;
    } catch (err) {
      handleApiError(err, 'Failed to remove member', state);
      return false;
    }
  };
};

export const useProjectMemberCRUD = (
  state: UseProjectMemberStateReturn
): UseProjectMemberCRUDReturn => {
  const assignUser = useCallback(
    async (projectId: string, data: AssignUserToProjectDto) => {
      return createAssignUserCallback(state)(projectId, data);
    },
    [state]
  );

  const updateMemberRole = useCallback(
    async (projectId: string, userId: string, role: ProjectRole) => {
      return createUpdateMemberRoleCallback(state)(projectId, userId, role);
    },
    [state]
  );

  const removeMember = useCallback(
    async (projectId: string, userId: string) => {
      return createRemoveMemberCallback(state)(projectId, userId);
    },
    [state]
  );

  return {
    assignUser,
    updateMemberRole,
    removeMember,
  };
};