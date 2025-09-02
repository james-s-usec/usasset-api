import { useEffect } from 'react';
import type { Project, ProjectMember } from '../types/project.types';
import { ProjectRole } from '../types/project.types';
import { useProjectMembers } from './useProjectMembers';
import { useUsers } from './useUsers';
import type { UserData } from '../types/user';

interface UseProjectMemberActionsReturn {
  members: ProjectMember[];
  loading: boolean;
  error: string | null;
  availableUsers: UserData[];
  handleAddMember: (userId: string, role: ProjectRole) => Promise<void>;
  handleUpdateRole: (memberId: string, role: ProjectRole) => Promise<void>;
  handleRemoveMember: (memberId: string) => Promise<void>;
}

// Helper function to create add member handler
const createAddMemberHandler = (
  project: Project | null,
  assignUser: (projectId: string, data: { user_id: string; role: ProjectRole }) => Promise<ProjectMember | undefined>
) => {
  return async (userId: string, role: ProjectRole): Promise<void> => {
    if (!project) return;
    await assignUser(project.id, { user_id: userId, role });
  };
};

// Helper function to create update role handler
const createUpdateRoleHandler = (
  project: Project | null,
  members: ProjectMember[],
  updateMemberRole: (projectId: string, userId: string, role: ProjectRole) => Promise<boolean>
) => {
  return async (memberId: string, role: ProjectRole): Promise<void> => {
    if (!project) return;
    const member = members.find(m => m.id === memberId);
    if (member && member.user) {
      await updateMemberRole(project.id, member.user.id, role);
    }
  };
};

// Helper function to create remove member handler
const createRemoveMemberHandler = (
  project: Project | null,
  members: ProjectMember[],
  removeMember: (projectId: string, userId: string) => Promise<boolean>
) => {
  return async (memberId: string): Promise<void> => {
    if (!project) return;
    const member = members.find(m => m.id === memberId);
    if (member && member.user && member.role !== ProjectRole.OWNER) {
      const userName = member.user.name || member.user.email;
      if (window.confirm(`Remove ${userName} from the project?`)) {
        await removeMember(project.id, member.user.id);
      }
    }
  };
};

// Helper function to filter available users
const filterAvailableUsers = (users: UserData[], members: ProjectMember[]): UserData[] => {
  return users.filter(
    (user) => !members.some(member => member.user && member.user.id === user.id)
  );
};

export const useProjectMemberActions = (open: boolean, project: Project | null): UseProjectMemberActionsReturn => {
  const { 
    members, 
    loading, 
    error,
    fetchMembers,
    assignUser,
    updateMemberRole,
    removeMember,
  } = useProjectMembers();
  
  const { users, fetchUsers } = useUsers();

  useEffect(() => {
    if (open && project) {
      void fetchMembers(project.id);
      void fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project?.id]); // Functions are stable, only depend on primitive values

  return {
    members,
    loading,
    error,
    availableUsers: filterAvailableUsers(users, members),
    handleAddMember: createAddMemberHandler(project, assignUser),
    handleUpdateRole: createUpdateRoleHandler(project, members, updateMemberRole),
    handleRemoveMember: createRemoveMemberHandler(project, members, removeMember),
  };
};